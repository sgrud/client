/* eslint-disable @typescript-eslint/no-var-requires */

import { Spawn, Thread } from '@sgrud/core';
import { createEndpoint, wrap } from 'comlink';
import express from 'express';
import { Server } from 'http';
import { from, map, switchMap } from 'rxjs';
import { Worker } from 'worker_threads';

declare global {
  // eslint-disable-next-line no-var
  var sgrud: boolean;
}

globalThis.Worker = jest.fn();

describe('@sgrud/core/thread/spawn', () => {

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/api/sgrud/v1/insmod', (_, r) => r.send({ }))
    .use('/node_modules/@sgrud/bus/worker', (_, r) => r.send(module))
    .listen(location.port));

  class Class {
    @Spawn(new Worker('(' + (() => {
      require('./dist/core').Thread()(class {
        /* eslint-disable @typescript-eslint/explicit-member-accessibility */
        /* eslint-disable @typescript-eslint/typedef */
        thirteen = 13;
        // @ts-expect-error implicit any
        callable = (...args) => args.length;
        /* eslint-enable @typescript-eslint/explicit-member-accessibility */
        /* eslint-enable @typescript-eslint/typedef */
      });
    }) + ')()', { eval: true }))
    public readonly worker!: Thread<{
      callable: (...args: any[]) => number;
      thirteen: number;
    }>;
    public readonly error!: Thread<any>;
    public readonly esm!: Thread<any>;
    public readonly umd!: Thread<any>;
  }

  const module = {
    name: '@sgrud/bus/worker',
    exports: './busWorker.esmod.js' as string | undefined,
    unpkg: './busWorker.unpkg.js' as string | undefined
  };

  describe('applying the decorator', () => {
    it('spawns the worker through the factory', (done) => {
      from(Class.prototype.worker).subscribe((worker) => {
        expect(worker).toBeInstanceOf(Function);
        done();
      });
    });
  });

  describe('getting a primitive', () => {
    it('returns the promisified value', (done) => {
      from(Class.prototype.worker).pipe(
        switchMap((worker) => Promise.resolve(worker.thirteen))
      ).subscribe((thirteen) => {
        expect(thirteen).toBe(13);
        done();
      });
    });
  });

  describe('calling a function', () => {
    it('returns the promisified return value', (done) => {
      from(Class.prototype.worker).pipe(
        switchMap((worker) => Promise.resolve(worker.callable([], 1, '2')))
      ).subscribe((length) => {
        expect(length).toBe(3);
        done();
      });
    });
  });

  describe('getting a primitive from a new endpoint', () => {
    it('returns the promisified value from the new endpoint', (done) => {
      from(Class.prototype.worker).pipe(
        switchMap((worker) => worker[createEndpoint]()),
        map((messagePort) => wrap<any>(messagePort)),
        switchMap((worker) => Promise.resolve(worker.thirteen))
      ).subscribe((thirteen) => {
        expect(thirteen).toBe(13);
        done();
      });
    });
  });

  describe('calling a function on a new endpoint', () => {
    it('returns the promisified return value from the new endpoint', (done) => {
      from(Class.prototype.worker).pipe(
        switchMap((worker) => worker[createEndpoint]()),
        map((messagePort) => wrap<any>(messagePort)),
        switchMap((worker) => Promise.resolve(worker.callable([], 1, '2')))
      ).subscribe((length) => {
        expect(length).toBe(3);
        done();
      });
    });
  });

  describe('spawning a worker by string in an esm environment', () => {
    const worker = [
      [
        location.origin,
        'node_modules',
        module.name,
        module.exports
      ].join('/'),
      {
        type: 'module'
      }
    ];

    it('spawns the esm worker through the factory', async() => {
      jest.resetModules();
      globalThis.process = undefined!;

      const { Spawn: Decorator } = require('@sgrud/core');
      Decorator('@sgrud/bus/worker')(Class.prototype, 'esm');

      await expect(Class.prototype.esm).resolves.toBeInstanceOf(Function);
      expect(globalThis.Worker).toBeCalledWith(...worker);
    });
  });

  describe('spawning a worker by string in an umd environment', () => {
    const worker = [
      [
        location.origin,
        'node_modules',
        module.name,
        module.unpkg
      ].join('/'),
      {
        type: 'classic'
      }
    ];

    it('spawns the umd worker through the factory', async() => {
      jest.resetModules();
      globalThis.process = undefined!;
      globalThis.sgrud = true;

      const { Spawn: Decorator } = require('@sgrud/core');
      Decorator('@sgrud/bus/worker')(Class.prototype, 'umd');

      await expect(Class.prototype.umd).resolves.toBeInstanceOf(Function);
      expect(globalThis.Worker).toBeCalledWith(...worker);
    });
  });

  describe('spawning a worker by string in an incompatible environment', () => {
    it('throws an error', async() => {
      jest.resetModules();
      globalThis.process = undefined!;
      delete module.exports;
      delete module.unpkg;

      const { Spawn: Decorator } = require('@sgrud/core');
      Decorator('@sgrud/bus/worker')(Class.prototype, 'error');

      await expect(Class.prototype.error).rejects.toThrowError(ReferenceError);
    });
  });

});
