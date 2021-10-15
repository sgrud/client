import { provide, Registry } from '@sgrud/utils';

describe('@sgrud/utils/super/registry', () => {

  abstract class Class {
    public static readonly [provide]: 'sgrud.test.Class' = 'sgrud.test.Class';
  }

  describe('creating a new registry', () => {
    const registry = new Registry();

    it('returns the singleton registry', () => {
      expect(registry).toBe(new Registry());
    });
  });

  describe('registering a constructor by magic string', () => {
    const registry = new Registry();
    registry.set(Class[provide], Class);

    it('registers the decorated constructor by magic string', () => {
      expect(registry.get('sgrud.test.Class')).toBe(Class);
    });

    it('throws if no constructor was registered for the magic string', () => {
      expect(() => registry.get('sgrud.test.Error')).toThrowError(TypeError);
    });
  });

});
