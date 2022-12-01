import { BusHandler, BusValue, Subscribe } from '@sgrud/bus';
import { Observable, of } from 'rxjs';

describe('@sgrud/bus/handler/subscribe', () => {

  class ClassOne {
    @Subscribe('sgrud.test.bus.one')
    public readonly bus!: Observable<BusValue<number>>;
  }

  class ClassTwo {
    @Subscribe('sgrud.test.bus', 'handle')
    public readonly bus!: Observable<BusValue<number>>;
    public constructor(public readonly handle: string) { }
  }

  describe('applying the decorator', () => {
    const classOne = new ClassOne();
    const write = () => Object.assign(classOne, {
      bus: new Observable<BusValue<number>>()
    });

    it('freezes the bus on the prototype', () => {
      expect(classOne.bus).toBeInstanceOf(Observable);
      expect(classOne.bus).toBe(new ClassOne().bus);
      expect(write).toThrowError(TypeError);
    });
  });

  describe('applying the scoped decorator', () => {
    const classTwo = new ClassTwo('two');
    const write = () => Object.assign(classTwo, {
      bus: new Observable<BusValue<number>>()
    });

    it('freezes the bus on the instance', () => {
      expect(classTwo.bus).toBeInstanceOf(Observable);
      expect(classTwo.bus).not.toBe(new ClassTwo('two').bus);
      expect(write).toThrowError(TypeError);
    });
  });

  describe('subscribing to the decorated prototype property', () => {
    const handler = new BusHandler();
    const classOne = new ClassOne();

    it('observes values emitted by the supplied handle', (done) => {
      const subscription = classOne.bus.subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.one');
        expect(value).toBe(1);
        subscription.unsubscribe();
      });

      subscription.add(done);
      handler.set('sgrud.test.bus.one', of(1));
    });
  });

  describe('subscribing to the decorated instance property', () => {
    const handler = new BusHandler();
    const classTwo = new ClassTwo('two');

    it('observes values emitted by the scoped handle', (done) => {
      const subscription = classTwo.bus.subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.test.bus.two');
        expect(value).toBe(2);
        subscription.unsubscribe();
      });

      subscription.add(done);
      handler.set('sgrud.test.bus.two', of(2));
    });
  });

});
