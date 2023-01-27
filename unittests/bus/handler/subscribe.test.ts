import { BusHandler, BusValue, Subscribe } from '@sgrud/bus';
import { Observable, of } from 'rxjs';

describe('@sgrud/bus/handler/subscribe', () => {

  class ClassOne {
    @Subscribe('sgrud.test.bus.one')
    public readonly bus!: Observable<BusValue<string>>;
  }

  class ClassTwo {
    @Subscribe('sgrud.test.bus', 'handle')
    public readonly bus!: Observable<BusValue<string>>;
    public constructor(public readonly handle: string) { }
  }

  describe('applying the decorator', () => {
    const assign = () => Object.assign(classOne, { bus: undefined });
    const classOne = new ClassOne();

    it('freezes the bus on the prototype', () => {
      expect(classOne.bus).toBeInstanceOf(Observable);
      expect(classOne.bus).toBe(new ClassOne().bus);
      expect(assign).toThrowError(TypeError);
    });
  });

  describe('applying the scoped decorator', () => {
    const assign = () => Object.assign(classTwo, { bus: undefined });
    const classTwo = new ClassTwo('two');

    it('freezes the bus on the instance', () => {
      expect(classTwo.bus).toBeInstanceOf(Observable);
      expect(classTwo.bus).not.toBe(new ClassTwo('two').bus);
      expect(assign).toThrowError(TypeError);
    });
  });

  describe('subscribing to the decorated prototype property', () => {
    const classOne = new ClassOne();
    const handler = new BusHandler();

    it('observes values emitted by the supplied handle', (done) => {
      const subscription = classOne.bus.subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.one');
        expect(value).toBe('one');
        subscription.unsubscribe();
      });

      subscription.add(done);
      handler.set('sgrud.test.bus.one', of('one')).subscribe();
    });
  });

  describe('subscribing to the decorated instance property', () => {
    const classTwo = new ClassTwo('two');
    const handler = new BusHandler();

    it('observes values emitted by the scoped handle', (done) => {
      const subscription = classTwo.bus.subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.two');
        expect(value).toBe('two');
        subscription.unsubscribe();
      });

      subscription.add(done);
      handler.set('sgrud.test.bus.two', of('two')).subscribe();
    });
  });

});
