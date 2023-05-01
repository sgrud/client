import { Bus, BusHandler } from '@sgrud/bus';
import { Subject, delay, from, map, switchMap, takeWhile, throwError, timer } from 'rxjs';

describe('@sgrud/bus/bus/bus', () => {

  describe('constructing a bus', () => {
    const handler = new BusHandler();
    const stream = new Subject();

    it('establishes a duplex stream', (done) => {
      const bus = new Bus('sgrud.test.bus');

      bus.subscribe({
        error: done,
        next: (next) => {
          expect(next).toBe('done');
        }
      });

      from(bus).pipe(takeWhile((next, index) => {
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
        error: done
      });

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
          case 2: expect(next).toMatchObject({
            handle: 'sgrud.test.bus',
            kind: 'N',
            value: 'done'
          }); break;
          case 3: expect(next).toMatchObject({
            handle: 'sgrud.test.bus',
            kind: 'C'
          }); break;
        }

        return next.kind !== 'C' || next.handle !== 'sgrud.test.bus';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.stream', stream).subscribe();
      stream.pipe(delay(250)).subscribe(bus);
    });
  });

  describe('throwing an error through a bus', () => {
    const handler = new BusHandler();

    it('correctly emits the error', (done) => {
      const bus = new Bus('sgrud.test.bus');

      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: 'sgrud.test.bus',
            kind: 'E'
          }); break;
        }

        return next.kind !== 'E';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(switchMap(() => {
        return throwError(() => new Error());
      })).subscribe(bus);
    });
  });

});
