import { Singleton } from '@sgrud/utils';

// Increase coverage
Object.setPrototypeOf = undefined!;

@Singleton<typeof Test>((instance) => {
  instance.param = 'updated';
})
class Test implements Singleton<typeof Test> {

  public param: string = 'initialized';

  public constructor(
    public field: number
  ) { }

  public reconstruct(field: number): void {
    this.field ||= field;
  }

}

const test = new Test(1);

describe('@sgrud/utils/singleton', () => {

  describe('providing a construct function', () => {
    it('mutates the singleton', () => {
      expect(test.param).toBe('updated');
    });
  });

  describe('creating a new singleton', () => {
    it('returns the singleton instance', () => {
      expect(new Test(2)).toBe(test);
    });

    it('calls the reconstruct method', () => {
      const spy = jest.spyOn(test, 'reconstruct');
      expect(new Test(3).field).toBe(1);
      expect(spy).toHaveBeenCalledWith(3);
    });

    it('does not mutate the singleton', () => {
      expect(new Test(4).field).toBe(1);
    });
  });

});
