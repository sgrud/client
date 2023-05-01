import { Singleton } from '@sgrud/core';

describe('@sgrud/core/utility/singleton', () => {

  /*
   * Variables
   */

  class Service {

    public property: number = 1;

    public constructor(
      public readonly param: number
    ) {}

  }

  @Singleton()
  class ServiceOne extends Service {}

  @Singleton((instance, [param]) => {
    instance.property = param;
    return instance;
  })
  class ServiceTwo extends Service {}

  /*
   * Unittests
   */

  describe('constructing an instance', () => {
    const serviceOne = new ServiceOne(2);
    const serviceTwo = new ServiceTwo(3);

    it('returns the singleton instance', () => {
      expect(new ServiceOne(4)).toBe(serviceOne);
      expect(new ServiceTwo(5)).toBe(serviceTwo);
    });

    it('does not mutate the singleton', () => {
      expect(new ServiceOne(6).param).toBe(2);
      expect(new ServiceTwo(7).param).toBe(3);
    });

    it('calls the decorated method', () => {
      expect(new ServiceOne(8).property).toBe(1);
      expect(new ServiceTwo(9).property).toBe(9);
    });
  });

});
