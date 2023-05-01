import { Merge } from '@sgrud/core';

describe('@sgrud/core/typing/merge', () => {

  /*
   * Variables
   */

  const object = {};

  /*
   * Unittests
   */

  describe('assigning to an unknown property merged with a known one', () => {
    const result = object as Merge<typeof object | { property?: null }>;

    it('compiles and runs without an error', () => {
      expect(result.property = null).toBeNull();
    });
  });

});
