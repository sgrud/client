import { Linker } from '@sgrud/utils';

describe('@sgrud/utils/linker/linker', () => {

  class ServiceOne {
    public constructor(public param: number = 0) { }
  }

  class ServiceTwo {
    public constructor(public param: number = 1) { }
  }

  describe('creating a new instance', () => {
    it('returns the singleton link map', () => {
      expect(new Linker()).toBe(new Linker());
    });
  });

  describe('resolving a target constructor', () => {
    it('returns the instance', () => {
      expect(new Linker().get(ServiceOne)).toBeInstanceOf(ServiceOne);
      expect(new Linker().get(ServiceOne)).toBe(new Linker().get(ServiceOne));
      expect((new Linker().get(ServiceOne) as ServiceOne).param).toBe(0);
    });
  });

  describe('preemptively inserting a link', () => {
    it('links the target constructor to the inserted instance', () => {
      const arg = [ServiceTwo, new ServiceTwo(2)];
      const spy = jest.spyOn(Linker.prototype, 'set');
      new Linker([arg as [typeof ServiceTwo, ServiceTwo]]);

      expect(spy).toHaveBeenCalledWith(...arg);
      expect(new Linker().get(ServiceTwo)).toBeInstanceOf(ServiceTwo);
      expect(new Linker().get(ServiceTwo)).toBe(new Linker().get(ServiceTwo));
      expect((new Linker().get(ServiceTwo) as ServiceTwo).param).toBe(2);
    });
  });

});
