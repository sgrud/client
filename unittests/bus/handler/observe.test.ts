import { BusHandler, Observe } from '@sgrud/bus';
import { Observable, Subject, map, timer } from 'rxjs';

describe('@sgrud/bus/handler/observe', () => {

  /*
   * Variables
   */

  class ClassOne {

    @Observe('sgrud.test.bus.one')
    public readonly observe!: Observable<string>;

  }

  class ClassTwo {

    @Observe('sgrud.test.bus', 'suffix')
    public readonly observe!: Observable<string>;

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
      expect(classOne.observe).toBeInstanceOf(Observable);
      expect(classOne.observe).toBe(new ClassOne().observe);
    });
  });

  describe('applying the suffixed decorator', () => {
    const classTwo = new ClassTwo('two');

    it('freezes the property on the instance', () => {
      expect(classTwo.observe).toBeInstanceOf(Observable);
      expect(classTwo.observe).not.toBe(new ClassTwo('two').observe);
    });
  });

  describe('subscribing to the decorated prototype property', () => {
    const handler = new BusHandler();
    const classOne = new ClassOne();
    const stream = new Subject();

    it('observes values emitted by the supplied handle', (done) => {
      classOne.observe.pipe(map((next) => {
        expect(next).toBe('done');
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.one', stream).subscribe();
    });
  });

  describe('subscribing to the decorated instance property', () => {
    const handler = new BusHandler();
    const classTwo = new ClassTwo('two');
    const stream = new Subject();

    it('observes values emitted by the suffixed handle', (done) => {
      classTwo.observe.pipe(map((next) => {
        expect(next).toBe('done');
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.bus.two', stream).subscribe();
    });
  });

});
