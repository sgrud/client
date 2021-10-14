import { ConduitHandler, Publish } from '@sgrud/bus';
import { Subject } from 'rxjs';

describe('@sgrud/bus/pubsub/publish', () => {

  class ClassOne {
    @Publish('sgrud.test.bus.one')
    public readonly conduit!: Subject<number>;
  }

  class ClassTwo {
    @Publish('sgrud.test.bus', 'handle')
    public readonly conduit: Subject<number>;
    public handle?: string;
    public constructor(handle?: string) {
      if (handle) this.handle = handle;
      this.conduit = new Subject<number>();
    }
  }

  describe('applying the decorator', () => {
    const classOne = new ClassOne();
    const write = () => Object.assign(classOne, {
      conduit: new Subject<number>()
    });

    it('freezes the conduit on the prototype', () => {
      expect(classOne.conduit).toBeInstanceOf(Subject);
      expect(classOne.conduit).toBe(new ClassOne().conduit);
      expect(write).toThrowError(TypeError);
    });
  });

  describe('applying the scoped decorator', () => {
    const classTwo = new ClassTwo('two');
    const write = () => Object.assign(classTwo, {
      conduit: new Subject<number>()
    });

    it('freezes the conduit on the instance', () => {
      expect(classTwo.conduit).toBeInstanceOf(Subject);
      expect(write).toThrowError(TypeError);
      classTwo.conduit.complete();
    });
  });

  describe('calling next on the decorated prototype property', () => {
    const classOne = new ClassOne();
    const handler = new ConduitHandler();

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
        classOne.conduit.complete();
        done();
      });

      setTimeout(() => classOne.conduit.next(1), 250);
    });
  });

  describe('calling next on the decorated instance property', () => {
    const classTwo = new ClassTwo();
    const handler = new ConduitHandler();

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
        classTwo.conduit.complete();
        done();
      });

      setTimeout(() => classTwo.conduit.next(2), 250);
    });
  });

});
