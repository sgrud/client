import { ConduitHandler, ConduitValue, Subscribe } from '@sgrud/bus';
import { Observable, of } from 'rxjs';

describe('@sgrud/bus/pubsub/subscribe', () => {

  class ClassOne {
    @Subscribe('sgrud.bus.test.one')
    public readonly conduit!: Observable<ConduitValue<number>>;
  }

  class ClassTwo {
    @Subscribe('sgrud.bus.test', 'handle')
    public readonly conduit!: Observable<ConduitValue<number>>;
    public constructor(public readonly handle: string) { }
  }

  describe('applying the decorator', () => {
    const classOne = new ClassOne();
    const write = () => Object.assign(classOne, {
      conduit: new Observable<ConduitValue<number>>()
    });

    it('freezes the conduit on the prototype', () => {
      expect(classOne.conduit).toBeInstanceOf(Observable);
      expect(classOne.conduit).toBe(new ClassOne().conduit);
      expect(write).toThrowError(TypeError);
    });
  });

  describe('applying the scoped decorator', () => {
    const classTwo = new ClassTwo('two');
    const write = () => Object.assign(classTwo, {
      conduit: new Observable<ConduitValue<number>>()
    });

    it('freezes the conduit on the instance', () => {
      expect(classTwo.conduit).toBeInstanceOf(Observable);
      expect(classTwo.conduit).not.toBe(new ClassTwo('two').conduit);
      expect(write).toThrowError(TypeError);
    });
  });

  describe('subscribing to the decorated prototype property', () => {
    const classOne = new ClassOne();
    const handler = new ConduitHandler();

    it('observes values emitted by the supplied handle', (done) => {
      const subscription = classOne.conduit.subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.one');
        expect(value).toBe(1);
        subscription.unsubscribe();
      });

      subscription.add(done);
      handler.set('sgrud.bus.test.one', of(1));
    });
  });

  describe('subscribing to the decorated instance property', () => {
    const classTwo = new ClassTwo('two');
    const handler = new ConduitHandler();

    it('observes values emitted by the scoped handle', (done) => {
      const subscription = classTwo.conduit.subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.two');
        expect(value).toBe(2);
        subscription.unsubscribe();
      });

      subscription.add(done);
      handler.set('sgrud.bus.test.two', of(2));
    });
  });

});
