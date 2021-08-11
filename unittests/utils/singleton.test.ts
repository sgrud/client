import { Singleton } from '@sgrud/utils';

class Class {

  public param: string = 'default';

  public constructor(
    public field: number
  ) { }

}

@Singleton<typeof ClassOne>()
class ClassOne extends Class { }

@Singleton<typeof ClassTwo>((instance) => {
  instance.param = 'updated';
})
class ClassTwo extends Class implements Singleton<typeof Class> {

  public reconstruct(field: number): void {
    void field;
  }

}

const singleton = new ClassOne(0);
const coupleton = new ClassTwo(0);

describe('@sgrud/utils/singleton', () => {

  describe('providing a construct function', () => {
    it('mutates the singleton', () => {
      expect(singleton.param).toBe('default');
      expect(coupleton.param).toBe('updated');
    });
  });

  describe('creating a new instance', () => {
    it('returns the singleton instance', () => {
      expect(new ClassOne(1)).toBe(singleton);
      expect(new ClassTwo(1)).toBe(coupleton);
    });

    it('does not mutate the singleton', () => {
      expect(new ClassOne(2).field).toBe(0);
      expect(new ClassTwo(2).field).toBe(0);
    });

    it('calls the reconstruct method', () => {
      const spy = jest.spyOn(coupleton, 'reconstruct');
      expect(new ClassTwo(3).field).toBe(0);
      expect(spy).toHaveBeenCalledWith(3);
    });
  });

});
