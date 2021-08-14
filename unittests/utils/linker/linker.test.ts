import { Linker } from '@sgrud/utils';

describe('@sgrud/utils/linker/linker', () => {

  class ServiceOne {
    public constructor(public param: number = 0) { }
  }

  class ServiceTwo {
    public constructor(public param: number = 1) { }
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
      expect(linker.get(ServiceOne).param).toBe(0);
    });
  });

  describe('preemptively inserting an instance', () => {
    const arg = [ServiceTwo, new ServiceTwo(2)];
    const spy = jest.spyOn(Linker.prototype, 'set');
    const linker = new Linker([arg as [typeof ServiceTwo, ServiceTwo]]);

    it('links the target constructor to the inserted instance', () => {
      expect(spy).toHaveBeenCalledWith(...arg);
      expect(linker.get(ServiceTwo)).toBeInstanceOf(ServiceTwo);
      expect(linker.get(ServiceTwo)).toBe(new Linker().get(ServiceTwo));
      expect(linker.get(ServiceTwo).param).toBe(2);
    });
  });

});
