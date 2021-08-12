import { Uplink } from '@sgrud/utils';

describe('@sgrud/utils/linker/uplink', () => {

  class ClassOne {
    @Uplink(() => ClassTwo) public readonly class!: ClassTwo;
    @Uplink(() => Service) public readonly service!: Service;
  }

  class ClassTwo {
    @Uplink(() => ClassOne) public readonly class!: ClassOne;
    @Uplink(() => Service) public readonly service!: Service;
  }

  class Service {
    public readonly member: Date = new Date();
  }

  describe('applying the decorator', () => {
    it('links the instance to the prototype', () => {
      expect(ClassOne.prototype.service).toBeInstanceOf(Service);
      expect(ClassTwo.prototype.service).toBeInstanceOf(Service);
    });
  });

  describe('applying the decorator again', () => {
    it('links the same instance to the prototype', () => {
      expect(new ClassOne().service).toBe(new ClassTwo().service);
      expect(new ClassOne().service.member).toBe(new ClassTwo().service.member);
    });
  });

  describe('creating circular depencencies', () => {
    it('correctly resolves each dependency', () => {
      expect(new ClassOne().class).toBeInstanceOf(ClassTwo);
      expect(new ClassTwo().class).toBeInstanceOf(ClassOne);
    });
  });

});
