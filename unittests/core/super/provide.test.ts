import { Provide, provide, Registry } from '@sgrud/core';

describe('@sgrud/core/super/provide', () => {

  /*
   * Variables
   */

  @Provide()
  abstract class Base {

    public static readonly [provide]: 'sgrud.test.Base' = 'sgrud.test.Base';

  }

  /*
   * Unittests
   */

  describe('applying the decorator and enforced symbol', () => {
    const registry = new Registry();

    it('registers the decorated constructor by magic string', () => {
      expect(registry.get('sgrud.test.Base')).toBe(Base);
    });
  });

});
