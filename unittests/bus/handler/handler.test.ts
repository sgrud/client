/* @jest-environment-options { "url": "ws://127.0.0.1:58081" } */

import { BusHandler } from '@sgrud/bus';
import express from 'express';
import { BehaviorSubject, delay, from, fromEvent, map, materialize, Subject, switchMap, takeWhile, throwError, timeout, TimeoutError, timer } from 'rxjs';
import { WebSocketServer } from 'ws';

describe('@sgrud/bus/handler/handler', () => {

  /*
   * Fixtures
   */

  let server: WebSocketServer;
  afterAll(() => server.close());
  beforeAll(() => (server = new WebSocketServer({
    server: express().listen(location.port)
  })).on('connection', (socket) => {
    fromEvent(socket, 'message').pipe(delay(250)).subscribe((next) => {
      socket.send(JSON.stringify({
        handle: 'sgrud.test.bus.socket',
        kind: 'N',
        value: JSON.parse((next as MessageEvent).data)
      }));
    });
  }));

  afterEach(() => (globalThis.Worker as jest.Mock).mockClear());
  globalThis.Worker = jest.fn();

  /*
   * Variables
   */

  const module = {
    name: '@sgrud/bus/worker',
    exports: './worker.esmod.js',
    unpkg: './worker.unpkg.js'
  };

  /*
   * Unittests
   */

  describe('constructing an instance', () => {
    const handler = new BusHandler();
    const worker = from(handler.worker);

    it('returns the singleton instance', () => {
      expect(handler).toBe(new BusHandler());
    });

    it('spawns the corresponding worker', (done) => {
      worker.pipe(map((next) => {
        expect(next).toBeInstanceOf(Function);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('observing a stream by handle', () => {
    const handler = new BusHandler();
    const stream = new Subject();

    it('observes values emitted under the handle', (done) => {
      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.stream',
            kind: 'N',
            value: 'done'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.stream',
            kind: 'C'
          }); break;
        }

        return next.kind !== 'C';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.stream', stream).subscribe();
    });
  });

  describe('observing a immediately emitting stream by handle', () => {
    const handler = new BusHandler();
    const stream = new BehaviorSubject('default');

    it('observes values emitted under the handle', (done) => {
      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.stream',
            kind: 'N',
            value: 'default'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.stream',
            kind: 'N',
            value: 'done'
          }); break;
          case 2: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.stream',
            kind: 'C'
          }); break;
        }

        return next.kind !== 'C';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.stream', stream).subscribe();
    });
  });

  describe('observing an empty stream by handle', () => {
    const handler = new BusHandler();
    const stream = new Subject();

    it('does not emit any values under the handle', (done) => {
      handler.observe('sgrud.test.bus.empty').pipe(
        timeout(500),
        materialize(),
        takeWhile((next, index) => {
          switch (index) {
            case 0: expect(next).toMatchObject({
              error: expect.any(TimeoutError),
              kind: 'E'
            }); break;
          }

          return next.kind !== 'E';
        })
      ).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.stream', stream).subscribe();
    });
  });

  describe('observing an erroring stream by handle', () => {
    const handler = new BusHandler();
    const stream = timer(250).pipe(switchMap(() => throwError(() => 'error')));

    it('observes errors emitted under the handle', (done) => {
      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            error: 'error',
            handle: 'sgrud.test.bus.error',
            kind: 'E'
          }); break;
        }

        return next.kind !== 'E';
      })).subscribe({
        complete: done,
        error: done
      });

      handler.publish('sgrud.test.bus.error', stream).subscribe();
    });
  });

  describe('observing an uplinked stream by handle', () => {
    const handler = new BusHandler();
    const stream = new Subject();

    it('observes values emitted under the handle', (done) => {
      handler.uplink('sgrud.test.bus', location.href).subscribe({
        error: done
      });

      handler.observe('sgrud.test.bus').pipe(takeWhile((next: any, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.stream',
            kind: 'N',
            value: 'done'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.stream',
            kind: 'C'
          }); break;
          case 2: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.socket',
            kind: 'N',
            value: {
              handle: 'sgrud.test.bus.stream',
              kind: 'N',
              value: 'done'
            }
          }); break;
          case 3: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.socket',
            kind: 'N',
            value: {
              handle: 'sgrud.test.bus.stream',
              kind: 'C'
            }
          }); break;
        }

        return next.value?.kind !== 'C';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.stream', stream).subscribe();
    });
  });

  describe('constructing an instance in an node environment', () => {
    it('constructs a node worker through the factory', async() => {
      jest.resetModules();

      jest.mock('comlink', () => ({
        ...jest.requireActual('comlink'),
        wrap: jest.fn(() => module)
      }));

      jest.mock('rxjs', () => ({
        ...jest.requireActual('rxjs'),
        firstValueFrom: () => Promise.resolve(module)
      }));

      const { BusHandler: Handler } = require('@sgrud/bus');
      await expect(new Handler().worker).resolves.toBe(module);
    });
  });

  describe('constructing an instance in an esm environment', () => {
    it('constructs an esm worker through the factory', async() => {
      globalThis.process = undefined!;
      jest.resetModules();

      const { BusHandler: Handler } = require('@sgrud/bus');
      await expect(new Handler().worker).resolves.toBe(module);

      expect(globalThis.Worker).toBeCalledWith(
        `/node_modules/${module.name}/${module.exports}`, { type: 'module' }
      );
    });
  });

  describe('constructing an instance in an umd environment', () => {
    it('constructs an umd worker through the factory', async() => {
      globalThis.sgrud = undefined! || true;
      jest.resetModules();

      const { BusHandler: Handler } = require('@sgrud/bus');
      await expect(new Handler().worker).resolves.toBe(module);

      expect(globalThis.Worker).toBeCalledWith(
        `/node_modules/${module.name}/${module.unpkg}`, { type: 'classic' }
      );
    });
  });

  describe('constructing an instance in an incompatible environment', () => {
    it('throws an error on worker construction', async() => {
      module.exports = undefined!;
      module.unpkg = undefined!;
      jest.resetModules();

      const { BusHandler: Handler } = require('@sgrud/bus');
      await expect(new Handler().worker).rejects.toThrow();
    });
  });

});
