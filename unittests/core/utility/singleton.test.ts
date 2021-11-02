import { Singleton } from '@sgrud/core';

describe('@sgrud/core/utility/singleton', () => {

  class Class {
    public member: number = 1;
    public constructor(public readonly param: number) { }
  }

  @Singleton<typeof ClassOne>()
  class ClassOne extends Class { }

  @Singleton<typeof ClassTwo>((instance, [param]) => {
    instance.member = param;
    return instance;
  })
  class ClassTwo extends Class { }

  describe('creating a new instance', () => {
    const classOne = new ClassOne(2);
    const classTwo = new ClassTwo(3);

    it('returns the singleton instance', () => {
      expect(new ClassOne(4)).toBe(classOne);
      expect(new ClassTwo(5)).toBe(classTwo);
    });

    it('does not mutate the singleton', () => {
      expect(new ClassOne(6).param).toBe(2);
      expect(new ClassTwo(7).param).toBe(3);
    });

    it('calls the decorated method', () => {
      expect(new ClassOne(8).member).toBe(1);
      expect(new ClassTwo(9).member).toBe(9);
    });
  });

});
