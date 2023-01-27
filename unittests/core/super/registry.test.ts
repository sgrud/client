import { provide, Provider, Registry } from '@sgrud/core';

describe('@sgrud/core/super/registry', () => {

  new Registry();

  abstract class Base {
    public static readonly [provide]:
    'sgrud.test.Base' = 'sgrud.test.Base' as const;
    public constructor(public readonly baseParam: string) { }
    public baseSelf: () => this = () => this;
    public self: () => this = () => this;
  }

  class Class extends Provider<typeof Base>('sgrud.test.Base') {
    public constructor(public readonly classParam: string) {
      super(classParam);
    }
    public classSelf: () => this = () => this;
    public override self: () => this = () => this;
  }

  describe('instantiating a registry', () => {
    const registry = new Registry();

    it('returns the singleton registry', () => {
      expect(registry).toBe(new Registry());
    });
  });

  describe('registering a constructor by magic string', () => {
    const construct = () => new unknown();
    const registry = new Registry();
    const unknown = class extends Provider('sgrud.test.unknown') { };

    registry.set('sgrud.test.Base', Base);

    it('registers the decorated constructor by magic string', () => {
      expect(registry.get('sgrud.test.Base')).toBe(Base);
    });

    it('throws if no constructor was registered for the magic string', () => {
      expect(construct).toThrowError(ReferenceError);
    });
  });

  describe('extending a provider by magic string before registering it', () => {
    const extending = new class extends Class { }('extending');
    const instance = new Class('instance');
    const unknown = new class { };

    it('calls the super constructor', () => {
      expect(instance.classParam).toBe('instance');
      expect(instance.baseParam).toBe('instance');
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
      expect(extending.classParam).toBe('extending');
      expect(extending.baseParam).toBe('extending');
      expect(extending.classSelf()).toBeInstanceOf(Class);
      expect(extending.baseSelf()).toBeInstanceOf(Base);
      expect(extending.self()).toBeInstanceOf(Class);
    });
  });

});
