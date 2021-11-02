import { Factor } from '@sgrud/core';

describe('@sgrud/core/linker/factor', () => {

  class ClassOne {
    @Factor(() => ClassTwo) public readonly class!: ClassTwo;
    @Factor(() => Service) public readonly service!: Service;
  }

  class ClassTwo {
    @Factor(() => ClassOne) public readonly class!: ClassOne;
    @Factor(() => Service) public readonly service!: Service;
  }

  class Service {
    public readonly member: Date = new Date();
  }

  describe('applying the decorator', () => {
    const classOne = new ClassOne();
    const classTwo = new ClassTwo();

    it('links the instance to the prototype', () => {
      expect(classOne.service).toBeInstanceOf(Service);
      expect(classTwo.service).toBeInstanceOf(Service);
    });
  });

  describe('applying the decorator again', () => {
    const classOne = new ClassOne();
    const classTwo = new ClassTwo();

    it('links the same instance to the prototype', () => {
      expect(classOne.service).toBe(classTwo.service);
      expect(classOne.service.member).toBe(classTwo.service.member);
    });
  });

  describe('creating circular dependencies', () => {
    const classOne = new ClassOne();
    const classTwo = new ClassTwo();

    it('correctly resolves each dependency', () => {
      expect(classOne.class).toBeInstanceOf(ClassTwo);
      expect(classTwo.class).toBeInstanceOf(ClassOne);
    });
  });

});
