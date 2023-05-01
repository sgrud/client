import { Factor, Linker, Target } from '@sgrud/core';

describe('@sgrud/core/linker/target', () => {

  /*
   * Variables
   */

  @Target(['base'])
  class Base {

    public constructor(
      public readonly param: string
    ) {}

  }

  class Service extends Base {

    public constructor(param: string) {
      super(param + '-service');
    }

  }

  class Class {

    @Factor<Target<Base>>(() => Base)
    public readonly property!: Base;

  }

  /*
   * Unittests
   */

  describe('applying the decorator', () => {
    const base = new Linker<Target<Base>>().get(Base);

    it('creates the instance from provided constructor parameters', () => {
      expect(base.param).toBe('base');
    });

    it('links the instance to the target constructor', () => {
      expect(base).toBeInstanceOf(Base);
    });
  });

  describe('factoring the target constructor', () => {
    it('links the instance to the prototype', () => {
      expect(Class.prototype.property).toBeInstanceOf(Base);
    });
  });

  describe('overriding a targeted constructor', () => {
    it('links the overridden instance to the targeted constructor', () => {
      Target(['target'], Base)(Service);

      expect(Class.prototype.property).toBeInstanceOf(Service);
      expect(Class.prototype.property.param).toBe('target-service');
    });
  });

});
