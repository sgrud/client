import { Provide, provide, Registry } from '@sgrud/core';

describe('@sgrud/core/super/provide', () => {

  @Provide<typeof Class>()
  abstract class Class {
    public static readonly [provide]:
    'sgrud.test.Class' = 'sgrud.test.Class' as const;
  }

  describe('applying the decorator and enforced symbol', () => {
    const registry = new Registry();

    it('registers the decorated constructor by magic string', () => {
      expect(registry.get('sgrud.test.Class')).toBe(Class);
    });
  });

});
