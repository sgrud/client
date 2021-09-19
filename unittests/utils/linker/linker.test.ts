import { Linker } from '@sgrud/utils';

describe('@sgrud/utils/linker/linker', () => {

  class Service { }

  class ServiceOne extends Service {
    public constructor(public param: string = 'one') {
      super();
    }
  }

  class ServiceTwo extends Service {
    public constructor(public param: string = 'two') {
      super();
    }
  }

  describe('creating a new linker', () => {
    const linker = new Linker();

    it('returns the singleton linker', () => {
      expect(linker).toBe(new Linker());
    });
  });

  describe('resolving a target constructor', () => {
    const linker = new Linker<typeof ServiceOne, ServiceOne>();

    it('returns the linked instance', () => {
      expect(linker.get(ServiceOne)).toBeInstanceOf(ServiceOne);
      expect(linker.get(ServiceOne)).toBe(new Linker().get(ServiceOne));
      expect(linker.get(ServiceOne).param).toBe('one');
    });
  });

  describe('preemptively inserting an instance', () => {
    const arg = [ServiceTwo, new ServiceTwo('three')];
    const spy = jest.spyOn(Linker.prototype, 'set');
    const linker = new Linker([
      arg as [typeof ServiceTwo, ServiceTwo]
    ]);

    it('links the target constructor to the inserted instance', () => {
      expect(linker.get(ServiceTwo)).toBeInstanceOf(ServiceTwo);
      expect(linker.get(ServiceTwo)).toBe(new Linker().get(ServiceTwo));
      expect(linker.get(ServiceTwo).param).toBe('three');
      expect(spy).toHaveBeenCalledWith(...arg);
    });
  });

  describe('resolving all extending constructors', () => {
    const linker = new Linker();

    it('returns all extending linked instance', () => {
      expect(linker.getAll(Service)).toContain(linker.get(ServiceOne));
      expect(linker.getAll(Service)).toContain(linker.get(ServiceTwo));
    });
  });

});
