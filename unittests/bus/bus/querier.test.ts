import { Bus, BusHandler, BusQuerier } from '@sgrud/bus';
import { Linker, Target } from '@sgrud/core';
import { Model } from '@sgrud/data';
import { BehaviorSubject, Subject, catchError, delay, map, of, switchMap, takeWhile, throwError, timer } from 'rxjs';

describe('@sgrud/bus/bus/querier', () => {

  /*
   * Variables
   */

  class Class extends Model<Class> {

    protected readonly [Symbol.toStringTag]: string = 'Class';

  }

  /*
   * Unittests
   */

  describe('subscribing to an operation through the bus querier', () => {
    const handler = new BusHandler();
    const linker = new Linker<Target<BusQuerier>>();
    const stream = new BehaviorSubject('default');
    const commit = Class.commit('subscription test', { subscription: 'test' });

    it('subscribes to the operation through the bus querier', (done) => {
      linker.set(BusQuerier, new BusQuerier('sgrud.test.bus'));

      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: expect.stringContaining('sgrud.test.bus.subscription'),
            kind: 'N',
            value: {
              query: 'subscription test',
              variables: {
                subscription: 'test'
              }
            }
          }); break;
          case 1: expect(next).toMatchObject({
            handle: expect.stringContaining('sgrud.test.bus.subscription'),
            kind: 'C'
          }); break;
        }

        if (next.kind === 'C') {
          const handle = `${next.handle}.test` as Bus.Handle;
          of('done').pipe(delay(250)).subscribe(stream);
          handler.publish(handle, stream).subscribe();
        }

        return next.kind !== 'C';
      })).subscribe({
        error: done
      });

      commit.pipe(map((next, index) => {
        switch (index) {
          case 0: expect(next).toBe('default'); break;
          case 1: expect(next).toBe('done'); break;
        }
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('re-targeting the bus querier', () => {
    const handler = new BusHandler();
    const linker = new Linker<Target<BusQuerier>>();
    const stream = new Subject();
    const commit = Class.commit('mutation test', { mutation: 'test' });

    it('overrides the previously targeted bus querier', (done) => {
      linker.set(BusQuerier, new BusQuerier('sgrud.test.bus', new Map([
        [Class, 50]
      ])));

      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: expect.stringContaining('sgrud.test.bus.mutation'),
            kind: 'N',
            value: {
              query: 'mutation test',
              variables: {
                mutation: 'test'
              }
            }
          }); break;
          case 1: expect(next).toMatchObject({
            handle: expect.stringContaining('sgrud.test.bus.mutation'),
            kind: 'C'
          }); break;
        }

        if (next.kind === 'C') {
          const handle = `${next.handle}.test` as Bus.Handle;
          of('done').pipe(delay(250)).subscribe(stream);
          handler.publish(handle, stream).subscribe();
        }

        return next.kind !== 'C';
      })).subscribe({
        error: done
      });

      commit.pipe(map((next) => {
        expect(next).toBe('done');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('receiving an error through the bus querier', () => {
    const handler = new BusHandler();
    const linker = new Linker<Target<BusQuerier>>();
    const stream = timer(250).pipe(switchMap(() => throwError(() => 'error')));
    const commit = Class.commit('query error').pipe(
      catchError((error) => of(error))
    );

    it('emits the error to the observer', (done) => {
      linker.set(BusQuerier, new BusQuerier('sgrud.test.bus', new Map()));

      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: expect.stringContaining('sgrud.test.bus.query'),
            kind: 'N',
            value: {
              query: 'query error'
            }
          }); break;
          case 1: expect(next).toMatchObject({
            handle: expect.stringContaining('sgrud.test.bus.query'),
            kind: 'C'
          }); break;
        }

        if (next.kind === 'C') {
          const handle = `${next.handle}.test` as Bus.Handle;
          handler.publish(handle, stream).subscribe();
        }

        return next.kind !== 'C';
      })).subscribe({
        error: done
      });

      commit.pipe(map((next) => {
        expect(next).toBe('error');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
