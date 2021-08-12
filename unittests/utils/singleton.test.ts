import { Singleton } from '@sgrud/utils';

describe('@sgrud/utils/singleton', () => {

  class Class {
    public member: number = 0;
    public constructor(public readonly param: number) { }
  }

  @Singleton<typeof ClassOne>()
  class ClassOne extends Class { }

  @Singleton<typeof ClassTwo>((instance, [param]) => {
    instance.member = param;
    return instance;
  })
  class ClassTwo extends Class { }

  const classOne = new ClassOne(1);
  const classTwo = new ClassTwo(2);

  describe('creating a new instance', () => {
    it('returns the singleton instance', () => {
      expect(new ClassOne(3)).toBe(classOne);
      expect(new ClassTwo(4)).toBe(classTwo);
    });

    it('does not mutate the singleton', () => {
      expect(new ClassOne(5).param).toBe(1);
      expect(new ClassTwo(6).param).toBe(2);
    });

    it('calls the decorated method', () => {
      expect(new ClassOne(7).member).toBe(0);
      expect(new ClassTwo(8).member).toBe(8);
    });
  });

});
