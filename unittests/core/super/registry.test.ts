import { provide, Provider, Registry } from '@sgrud/core';

describe('@sgrud/core/super/registry', () => {

  /*
   * Variables
   */

  abstract class Base {

    public static readonly [provide]: 'sgrud.test.Base' = 'sgrud.test.Base';

    public constructor(
      public readonly baseParam: string
    ) {}

    public base: () => this = () => this;

    public self: () => this = () => this;

  }

  class Service extends Provider('sgrud.test.Base') {

    public constructor(
      public readonly serviceParam: string
    ) {
      super(serviceParam);
    }

    public self: () => this = () => this;

    public service: () => this = () => this;

  }

  /*
   * Unittests
   */

  describe('constructing an instance', () => {
    const registry = new Registry();

    it('returns the singleton instance', () => {
      expect(registry).toBe(new Registry());
    });
  });

  describe('registering a constructor by magic string', () => {
    const registry = new Registry().set('sgrud.test.Base', Base);
    const construct = () => new class extends Provider('sgrud.test.error') {};

    it('registers the decorated constructor by magic string', () => {
      expect(registry.get('sgrud.test.Base')).toBe(Base);
    });

    it('throws if no constructor was registered for the magic string', () => {
      expect(construct).toThrowError(ReferenceError);
    });
  });

  describe('extending a provider by magic string', () => {
    const extended = new class extends Service {}('extended');
    const instance = new Service('instance');
    const unknown = new class {};

    it('calls the super constructor', () => {
      expect(instance.base()).toBeInstanceOf(Base);
      expect(instance.self()).toBeInstanceOf(Service);
      expect(instance.service()).toBeInstanceOf(Service);
      expect(instance.baseParam).toBe('instance');
      expect(instance.serviceParam).toBe('instance');
    });

    it('does not interfere with downstream inheritance', () => {
      expect(extended.base()).toBeInstanceOf(Base);
      expect(extended.self()).toBeInstanceOf(Service);
      expect(extended.service()).toBeInstanceOf(Service);
      expect(extended.baseParam).toBe('extended');
      expect(extended.serviceParam).toBe('extended');
    });

    it('simulates the prototype chain', () => {
      expect(extended).toBeInstanceOf(Base);
      expect(extended).toBeInstanceOf(Service);
      expect(instance).toBeInstanceOf(Base);
      expect(instance).toBeInstanceOf(Service);
      expect(unknown).not.toBeInstanceOf(Base);
      expect(unknown).not.toBeInstanceOf(Service);
    });
  });

});
