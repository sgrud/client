import { BusHandler, Publish } from '@sgrud/bus';
import { Subject } from 'rxjs';

describe('@sgrud/bus/handler/publish', () => {

  class ClassOne {
    @Publish('sgrud.test.bus.one')
    public readonly bus!: Subject<string>;
  }

  class ClassTwo {
    @Publish('sgrud.test.bus', 'handle')
    public readonly bus: Subject<string>;
    public handle?: string;
    public constructor(handle?: string) {
      if (handle) this.handle = handle;
      this.bus = new Subject<string>();
    }
  }

  describe('applying the decorator', () => {
    const assign = () => Object.assign(classOne, { bus: undefined });
    const classOne = new ClassOne();

    it('freezes the bus on the prototype', () => {
      expect(classOne.bus).toBeInstanceOf(Subject);
      expect(classOne.bus).toBe(new ClassOne().bus);
      expect(assign).toThrowError(TypeError);
    });
  });

  describe('applying the scoped decorator', () => {
    const assign = () => Object.assign(classTwo, { bus: undefined });
    const classTwo = new ClassTwo('two');

    it('freezes the bus on the instance', () => {
      expect(classTwo.bus).toBeInstanceOf(Subject);
      expect(assign).toThrowError(TypeError);
      classTwo.bus.complete();
    });
  });

  describe('calling next on the decorated prototype property', () => {
    const classOne = new ClassOne();
    const handler = new BusHandler();

    it('emits values through the supplied handle', (done) => {
      const subscription = handler.get<string>(
        'sgrud.test.bus'
      ).subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.one');
        expect(value).toBe('one');
        subscription.unsubscribe();
      });

      subscription.add(() => {
        classOne.bus.complete();
        done();
      });

      setTimeout(() => classOne.bus.next('one'), 250);
    });
  });

  describe('calling next on the decorated instance property', () => {
    const classTwo = new ClassTwo();
    const handler = new BusHandler();

    it('emits values through the scoped handle', (done) => {
      classTwo.handle = 'two';

      const subscription = handler.get<string>(
        'sgrud.test.bus'
      ).subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.two');
        expect(value).toBe('two');
        subscription.unsubscribe();
      });

      subscription.add(() => {
        classTwo.bus.complete();
        done();
      });

      setTimeout(() => classTwo.bus.next('two'), 250);
    });
  });

});
