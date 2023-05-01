import { Spawn, Thread } from '@sgrud/core';
import { createEndpoint, wrap } from 'comlink';
import express from 'express';
import { Server } from 'http';
import { from, map, switchMap } from 'rxjs';
import { Worker } from 'worker_threads';

describe('@sgrud/core/thread/spawn', () => {

  /*
   * Fixtures
   */

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/node_modules/@sgrud/bus/worker', (_, r) => r.send(module))
    .listen(location.port));

  afterEach(() => (globalThis.Worker as jest.Mock).mockClear());
  globalThis.Worker = jest.fn();

  /*
   * Variables
   */

  class Handler {

    @Spawn(new Worker('(' + (() => {
      const Module = require('module');
      const { _resolveFilename } = Module;

      // @ts-expect-error implicit any
      Module._resolveFilename = (id, parent) => {
        if (id.startsWith('@sgrud/')) {
          return require.resolve(id.replace('@sgrud', './dist'));
        }

        return _resolveFilename(id, parent);
      };

      require('@sgrud/core').Thread()(class {
        /* eslint-disable @typescript-eslint/explicit-member-accessibility */
        /* eslint-disable @typescript-eslint/typedef */
        property = [{}];
        // @ts-expect-error implicit any
        method = (param) => param;
        /* eslint-enable @typescript-eslint/explicit-member-accessibility */
        /* eslint-enable @typescript-eslint/typedef */
      });
    }) + ')()', { eval: true }))
    public readonly worker!: Thread<{
      readonly property: [{}];
      readonly method: (param: unknown) => unknown;
    }>;

    public readonly cjs!: Thread<unknown>;

    public readonly esm!: Thread<unknown>;

    public readonly err!: Thread<unknown>;

    public readonly umd!: Thread<unknown>;

  }

  const module = {
    name: '@sgrud/bus/worker',
    exports: './worker.esmod.js',
    unpkg: './worker.unpkg.js'
  };

  /*
   * Unittests
   */

  describe('applying the decorator', () => {
    const spawn = from(Handler.prototype.worker);

    it('spawns the worker through the factory', (done) => {
      spawn.pipe(map((next) => {
        expect(next).toBeInstanceOf(Function);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('getting a value', () => {
    const spawn = from(Handler.prototype.worker).pipe(
      switchMap((worker) => Promise.resolve(worker.property)),
      switchMap((next) => Promise.resolve(next[0]))
    );

    it('returns the promisified value', (done) => {
      spawn.pipe(map((next) => {
        expect(next).toMatchObject({});
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling a method', () => {
    const spawn = from(Handler.prototype.worker).pipe(
      switchMap((worker) => Promise.resolve(worker.method([{}])))
    );

    it('returns the promisified return value', (done) => {
      spawn.pipe(map((next) => {
        expect(next).toMatchObject({});
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('getting a value from a new endpoint', () => {
    const spawn = from(Handler.prototype.worker).pipe(
      switchMap((worker) => worker[createEndpoint]()),
      map((messagePort) => wrap<any>(messagePort)),
      switchMap((worker) => Promise.resolve(worker.property)),
      switchMap((next) => Promise.resolve(next[0]))
    );

    it('returns the promisified value from the new endpoint', (done) => {
      spawn.pipe(map((next) => {
        expect(next).toMatchObject({});
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling a method on a new endpoint', () => {
    const spawn = from(Handler.prototype.worker).pipe(
      switchMap((worker) => worker[createEndpoint]()),
      map((messagePort) => wrap<any>(messagePort)),
      switchMap((worker) => Promise.resolve(worker.method([{}])))
    );

    it('returns the promisified return value from the new endpoint', (done) => {
      spawn.pipe(map((next) => {
        expect(next).toMatchObject({});
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('spawning a worker by string in an node environment', () => {
    it('spawns the node worker through the factory', async() => {
      jest.resetModules();

      require('@sgrud/core').Spawn(module.name)(Handler.prototype, 'cjs');
      await expect(Handler.prototype.cjs).resolves.toBeInstanceOf(Function);
    });
  });

  describe('spawning a worker by string in an esm environment', () => {
    it('spawns the esm worker through the factory', async() => {
      globalThis.process = undefined!;
      jest.resetModules();

      require('@sgrud/core').Spawn(module.name)(Handler.prototype, 'esm');
      await expect(Handler.prototype.esm).resolves.toBeInstanceOf(Function);

      expect(globalThis.Worker).toBeCalledWith(
        `/node_modules/${module.name}/${module.exports}`, { type: 'module' }
      );
    });
  });

  describe('spawning a worker by string in an umd environment', () => {
    it('spawns the umd worker through the factory', async() => {
      globalThis.sgrud = undefined! || true;
      jest.resetModules();

      require('@sgrud/core').Spawn(module.name)(Handler.prototype, 'umd');
      await expect(Handler.prototype.umd).resolves.toBeInstanceOf(Function);

      expect(globalThis.Worker).toBeCalledWith(
        `/node_modules/${module.name}/${module.unpkg}`, { type: 'classic' }
      );
    });
  });

  describe('spawning a worker by string in an incompatible environment', () => {
    it('throws an error', async() => {
      module.exports = undefined!;
      module.unpkg = undefined!;
      jest.resetModules();

      require('@sgrud/core').Spawn(module.name)(Handler.prototype, 'err');
      await expect(Handler.prototype.err).rejects.toThrowError(ReferenceError);
    });
  });

});
