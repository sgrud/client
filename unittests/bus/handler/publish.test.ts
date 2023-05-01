import { BusHandler, Publish } from '@sgrud/bus';
import { Subject, map, takeWhile, timer } from 'rxjs';

describe('@sgrud/bus/handler/publish', () => {

  /*
   * Variables
   */

  class ClassOne {

    @Publish('sgrud.test.bus.one')
    public readonly publish!: Subject<string>;

  }

  class ClassTwo {

    @Publish('sgrud.test.bus', 'suffix')
    public readonly publish!: Subject<string>;

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
      expect(classOne.publish).toBeInstanceOf(Subject);
      expect(classOne.publish).toBe(new ClassOne().publish);
    });
  });

  describe('applying the suffixed decorator', () => {
    const classTwo = new ClassTwo('test');

    it('freezes the property on the instance', () => {
      expect(classTwo.publish).toBeInstanceOf(Subject);
      expect(classTwo.publish).not.toBe(new ClassTwo('null').publish);
    });
  });

  describe('calling next on the decorated prototype property', () => {
    const handler = new BusHandler();
    const classOne = new ClassOne();

    it('emits values through the supplied handle', (done) => {
      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.one',
            kind: 'N',
            value: 'done'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.one',
            kind: 'C'
          }); break;
        }

        return next.kind !== 'C';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(classOne.publish);
    });
  });

  describe('calling next on the decorated instance property', () => {
    const handler = new BusHandler();
    const classTwo = new ClassTwo('two');

    it('emits values through the suffixed handle', (done) => {
      handler.observe('sgrud.test.bus').pipe(takeWhile((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.two',
            kind: 'N',
            value: 'done'
          }); break;
          case 1: expect(next).toMatchObject({
            handle: 'sgrud.test.bus.two',
            kind: 'C'
          }); break;
        }

        return next.kind !== 'C';
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(classTwo.publish);
    });
  });

});
