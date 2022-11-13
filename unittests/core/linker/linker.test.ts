import { Linker } from '@sgrud/core';

describe('@sgrud/core/linker/linker', () => {

  class Service {
    public constructor(public readonly param?: string) { }
  }

  class ServiceOne extends Service {
    public constructor(param: string = 'one') {
      super(param);
    }
  }

  class ServiceTwo extends Service {
    public constructor(param: string = 'two') {
      super(param);
    }
  }

  describe('instantiating a linker', () => {
    const linker = new Linker<typeof Service>();

    it('returns the singleton linker', () => {
      expect(linker).toBe(new Linker<typeof Service>());
    });
  });

  describe('resolving a target constructor', () => {
    const linker = new Linker<typeof ServiceOne | typeof ServiceTwo>();

    it('returns the linked instance', () => {
      expect(linker.get(ServiceOne)).toBeInstanceOf(ServiceOne);
      expect(linker.get(ServiceTwo)).toBeInstanceOf(ServiceTwo);
      expect(linker.get(ServiceOne).param).toBe('one');
      expect(linker.get(ServiceTwo).param).toBe('two');
    });
  });

  describe('programmatically inserting an instance', () => {
    const linker = new Linker<typeof ServiceTwo>();

    const update = () => linker.set(
      ServiceTwo, new ServiceTwo('three')
    );

    it('links the target constructor to the inserted instance', () => {
      expect(update()).toBe(linker);

      expect(linker.get(ServiceTwo)).toBeInstanceOf(ServiceTwo);
      expect(linker.get(ServiceTwo).param).toBe('three');
    });
  });

  describe('resolving all extending constructors', () => {
    const linker = new Linker<typeof Service>();

    it('returns all extending linked instance', () => {
      expect(linker.getAll(Service)).toContain(linker.get(ServiceOne));
      expect(linker.getAll(Service)).toContain(linker.get(ServiceTwo));
    });
  });

});
