import { ConduitHandler, Publish } from '@sgrud/bus';
import { Subject } from 'rxjs';

describe('@sgrud/bus/pubsub/publish', () => {

  class ClassOne {
    @Publish('sgrud.bus.test.one')
    public readonly conduit!: Subject<number>;
  }

  class ClassTwo {
    @Publish('sgrud.bus.test', 'handle')
    public readonly conduit: Subject<number> = new Subject<number>();
    public constructor(public readonly handle: string) { }
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
      const one = handler.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.one');
        expect(value).toBe(1);
        one.unsubscribe();
      });

      one.add(() => {
        classOne.conduit.complete();
        done();
      });

      setTimeout(() => classOne.conduit.next(1), 1000);
    });
  });

  describe('calling next on the decorated instance property', () => {
    const classTwo = new ClassTwo('two');
    const handler = new ConduitHandler();

    it('emits values through the scoped handle', (done) => {
      const two = handler.get('sgrud.bus.test').subscribe(({
        handle,
        value
      }) => {
        expect(handle).toBe('sgrud.bus.test.two');
        expect(value).toBe(2);
        two.unsubscribe();
      });

      two.add(() => {
        classTwo.conduit.complete();
        done();
      });

      setTimeout(() => classTwo.conduit.next(2), 1000);
    });
  });

});
