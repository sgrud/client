import { Factor, Linker } from '@sgrud/core';

describe('@sgrud/core/linker/factor', () => {

  /*
   * Variables
   */

  class ClassOne {

    @Factor(() => ClassTwo)
    public readonly class!: ClassTwo;

    @Factor(() => Service, true)
    public readonly service?: Service;

  }

  class ClassTwo {

    @Factor(() => ClassOne)
    public readonly class!: ClassOne;

    @Factor(() => Service, true)
    public readonly service?: Service;

  }

  class Service {}

  /*
   * Unittests
   */

  describe('applying the decorator', () => {
    const classOne = new ClassOne();
    const classTwo = new ClassTwo();

    it('links an instance and resolves circular dependencies', () => {
      expect(classOne.class).toBeInstanceOf(ClassTwo);
      expect(classTwo.class).toBeInstanceOf(ClassOne);
    });
  });

  describe('applying the decorator transiently', () => {
    const linker = new Linker();
    const classOne = new ClassOne();
    const classTwo = new ClassTwo();

    it('only links if an instance already exists', () => {
      expect(classOne.service).toBeUndefined();
      expect(classTwo.service).toBeUndefined();

      const service = linker.get(Service);
      expect(classOne.service).toBe(service);
      expect(classTwo.service).toBe(service);
    });
  });

});
