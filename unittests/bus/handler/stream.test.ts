import { Bus, BusHandler, Stream } from '@sgrud/bus';
import { Subject, delay, from, map, takeWhile, timer } from 'rxjs';

describe('@sgrud/bus/handler/stream', () => {

  /*
   * Variables
   */

  class ClassOne {

    @Stream('sgrud.test.bus.one')
    public readonly stream!: Bus<unknown, unknown>;

  }

  class ClassTwo {

    @Stream('sgrud.test.bus', 'suffix')
    public readonly stream!: Bus<unknown, unknown>;

    public constructor(
      public readonly suffix: string
    ) {}

  }

  /*
   * Unittests
   */

  describe('applying the decorator', () => {
    const classOne = new ClassOne();

    it('freezes the property on the prototype', () => {
      expect(classOne.stream).toBeInstanceOf(Bus);
      expect(classOne.stream).toBe(new ClassOne().stream);
    });
  });

  describe('applying the suffixed decorator', () => {
    const classTwo = new ClassTwo('test');

    it('freezes the property on the instance', () => {
      expect(classTwo.stream).toBeInstanceOf(Bus);
      expect(classTwo.stream).not.toBe(new ClassTwo('null').stream);
    });
  });

  describe('calling next on the decorated prototype property', () => {
    const handler = new BusHandler();
    const classOne = new ClassOne();
    const stream = new Subject();

    it('emits values through the supplied handle', (done) => {
      from(classOne.stream).pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.one.stream',
            kind: 'N',
            value: 'done'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.one.stream',
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
            handle: 'sgrud.test.bus.one.stream',
            kind: 'N',
            value: 'done'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.one.stream',
            kind: 'C'
          }); break;
          case 2: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.one',
            kind: 'N',
            value: 'done'
          }); break;
          case 3: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.one',
            kind: 'C'
          }); break;
        }

        return next.kind !== 'C' || next.handle !== 'sgrud.test.bus.one';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.one.stream', stream).subscribe();
      stream.pipe(delay(250)).subscribe(classOne.stream);
    });
  });

  describe('calling next on the decorated instance property', () => {
    const handler = new BusHandler();
    const classTwo = new ClassTwo('two');
    const stream = new Subject();

    it('emits values through the supplied handle', (done) => {
      from(classTwo.stream).pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.two.stream',
            kind: 'N',
            value: 'done'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.two.stream',
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
            handle: 'sgrud.test.bus.two.stream',
            kind: 'N',
            value: 'done'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.two.stream',
            kind: 'C'
          }); break;
          case 2: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.two',
            kind: 'N',
            value: 'done'
          }); break;
          case 3: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.two',
            kind: 'C'
          }); break;
        }

        return next.kind !== 'C' || next.handle !== 'sgrud.test.bus.two';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.two.stream', stream).subscribe();
      stream.pipe(delay(250)).subscribe(classTwo.stream);
    });
  });

});
