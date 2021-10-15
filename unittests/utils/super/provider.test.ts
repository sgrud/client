import { Provide, provide, Provider } from '@sgrud/utils';

describe('@sgrud/utils/super/provider', () => {

  @Provide<typeof Base>()
  abstract class Base {
    public static readonly [provide]: 'sgrud.test.Base' = 'sgrud.test.Base';
    public constructor(
      public readonly baseParam: string = baseParam
    ) { }
    public baseSelf: () => this = () => this;
    public self: () => this = () => this;
  }

  class Class extends Provider<typeof Base>('sgrud.test.Base') {
    public constructor(
      public readonly classParam: string = classParam
    ) {
      super(classParam);
    }
    public classSelf: () => this = () => this;
    public self: () => this = () => this;
  }

  describe('extending a provider by magic string', () => {
    const instance = new Class('child');
    const extending = new class extends Class { }('grandchild');
    const unknown = new class { };

    it('calls the super constructor', () => {
      expect(instance.classParam).toBe('child');
      expect(instance.baseParam).toBe('child');
      expect(instance.classSelf()).toBeInstanceOf(Class);
      expect(instance.baseSelf()).toBeInstanceOf(Base);
      expect(instance.self()).toBeInstanceOf(Class);
    });

    it('simulates the prototype chain', () => {
      expect(instance).toBeInstanceOf(Base);
      expect(instance).toBeInstanceOf(Class);
      expect(extending).toBeInstanceOf(Base);
      expect(extending).toBeInstanceOf(Class);
      expect(unknown).not.toBeInstanceOf(Base);
      expect(unknown).not.toBeInstanceOf(Class);
    });

    it('does not interfere with downstream inheritance', () => {
      expect(extending.classParam).toBe('grandchild');
      expect(extending.baseParam).toBe('grandchild');
      expect(extending.classSelf()).toBeInstanceOf(Class);
      expect(extending.baseSelf()).toBeInstanceOf(Base);
      expect(extending.self()).toBeInstanceOf(Class);
    });
  });

});
