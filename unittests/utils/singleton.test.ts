import { Singleton } from '@sgrud/utils';

@Singleton<typeof Class>((instance) => {
  instance.param = 'updated';
})
class Class implements Singleton<typeof Class> {

  public param: string = 'initialized';

  public constructor(
    public field: number
  ) { }

  public reconstruct(field: number): void {
    void field;
  }

}

const singleton = new Class(0);

describe('@sgrud/utils/singleton', () => {

  describe('providing a construct function', () => {
    it('mutates the singleton', () => {
      expect(singleton.param).toBe('updated');
    });
  });

  describe('creating a new instance', () => {
    it('returns the singleton instance', () => {
      expect(new Class(1)).toBe(singleton);
    });

    it('does not mutate the singleton', () => {
      expect(new Class(2).field).toBe(0);
    });

    it('calls the reconstruct method', () => {
      const spy = jest.spyOn(singleton, 'reconstruct');
      expect(new Class(3).field).toBe(0);
      expect(spy).toHaveBeenCalledWith(3);
    });
  });

});
