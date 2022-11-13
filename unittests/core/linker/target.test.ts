import { Factor, Linker, Target } from '@sgrud/core';

describe('@sgrud/core/linker/target', () => {

  @Target<typeof Service>(['target'])
  class Service {
    public constructor(public readonly param: string) { }
  }

  class Override extends Service {
    public constructor(param: string) {
      super(param + '-override');
    }
  }

  class Class {
    @Factor<Target<Service>>(() => Service) public readonly service!: Service;
  }

  describe('applying the decorator', () => {
    const service = new Linker<Target<Service>>().get(Service);

    it('creates the instance from provided constructor parameters', () => {
      expect(service.param).toBe('target');
    });

    it('links the instance to the target constructor', () => {
      expect(service).toBeInstanceOf(Service);
    });
  });

  describe('factoring the target constructor', () => {
    it('links the instance to the prototype', () => {
      expect(Class.prototype.service).toBeInstanceOf(Service);
    });
  });

  describe('overriding a targeted constructor', () => {
    it('links the overridden instance to the targeted constructor', () => {
      Target<typeof Service>(['target'], Service)(Override);
      expect(Class.prototype.service).toBeInstanceOf(Override);
      expect(Class.prototype.service.param).toBe('target-override');
    });
  });

});
