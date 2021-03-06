import { Factor, Linker, Target } from '@sgrud/core';

describe('@sgrud/core/linker/target', () => {

  @Target<typeof Service>('target')
  class Service {
    public constructor(public readonly param: string) { }
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
      expect(service).toBe(new Linker<Target<Service>>().get(Service));
    });
  });

  describe('factoring the target constructor', () => {
    it('links the instance to the prototype', () => {
      expect(Class.prototype.service).toBeInstanceOf(Service);
    });
  });

});
