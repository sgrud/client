import { Alias } from '@sgrud/core';

describe('@sgrud/core/typing/alias', () => {

  /*
   * Variables
   */

  const object = {};

  /*
   * Unittests
   */

  describe('assigning to an aliased type and its declared property', () => {
    const result: Alias<{ property?: null }> = object;

    it('compiles and runs without an error', () => {
      expect(result.property = null).toBeNull();
    });
  });

});
