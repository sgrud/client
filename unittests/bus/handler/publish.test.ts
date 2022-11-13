import { BusHandler, Publish } from '@sgrud/bus';
import { Subject } from 'rxjs';

describe('@sgrud/bus/handler/publish', () => {

  class ClassOne {
    @Publish('sgrud.test.bus.one')
    public readonly bus!: Subject<number>;
  }

  class ClassTwo {
    @Publish('sgrud.test.bus', 'handle')
    public readonly bus: Subject<number>;
    public handle?: string;
    public constructor(handle?: string) {
      if (handle) this.handle = handle;
      this.bus = new Subject<number>();
    }
  }

  describe('applying the decorator', () => {
    const classOne = new ClassOne();
    const write = () => Object.assign(classOne, {
      bus: new Subject<number>()
    });

    it('freezes the bus on the prototype', () => {
      expect(classOne.bus).toBeInstanceOf(Subject);
      expect(classOne.bus).toBe(new ClassOne().bus);
      expect(write).toThrowError(TypeError);
    });
  });

  describe('applying the scoped decorator', () => {
    const classTwo = new ClassTwo('two');
    const write = () => Object.assign(classTwo, {
      bus: new Subject<number>()
    });

    it('freezes the bus on the instance', () => {
      expect(classTwo.bus).toBeInstanceOf(Subject);
      expect(write).toThrowError(TypeError);
      classTwo.bus.complete();
    });
  });

  describe('calling next on the decorated prototype property', () => {
    const classOne = new ClassOne();
    const handler = new BusHandler();

    it('emits values through the supplied handle', (done) => {
      const subscription = handler.get('sgrud.test.bus').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.one');
        expect(value).toBe(1);
        subscription.unsubscribe();
      });

      subscription.add(() => {
        classOne.bus.complete();
        done();
      });

      setTimeout(() => classOne.bus.next(1), 250);
    });
  });

  describe('calling next on the decorated instance property', () => {
    const classTwo = new ClassTwo();
    const handler = new BusHandler();

    classTwo.handle = 'two';

    it('emits values through the scoped handle', (done) => {
      const subscription = handler.get('sgrud.test.bus').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.two');
        expect(value).toBe(2);
        subscription.unsubscribe();
      });

      subscription.add(() => {
        classTwo.bus.complete();
        done();
      });

      setTimeout(() => classTwo.bus.next(2), 250);
    });
  });

});
