import { Linker, Target, Uplink } from '@sgrud/utils';

describe('@sgrud/utils/linker/target', () => {

  @Target<typeof Service>(0)
  class Service {
    public constructor(public readonly param: number) { }
  }

  class Class {
    @Uplink<Target<Service>>(() => Service) public readonly service!: Service;
  }

  describe('applying the decorator', () => {
    const service = new Linker<Target<Service>, Service>().get(Service);

    it('links the instance to the target constructor', () => {
      expect(service).toBeInstanceOf(Service);
      expect(service).toBe(new Linker<Target<Service>, Service>().get(Service));
    });

    it('creates the instance from provided constructor parameters', () => {
      expect(service.param).toBe(0);
    });
  });

  describe('uplinking the target constructor', () => {
    it('links the instance to the prototype', () => {
      expect(Class.prototype.service).toBeInstanceOf(Service);
    });
  });

});
