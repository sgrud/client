import { Assign } from '@sgrud/core';

describe('@sgrud/core/typing/assign', () => {

  /*
   * Variables
   */

  const object = {} as { property: never };

  /*
   * Unittests
   */

  describe('assigning to an unknown property overridden by a known one', () => {
    const result = object as Assign<{ property?: null }, typeof object>;

    it('compiles and runs without an error', () => {
      expect(result.property = null).toBeNull();
    });
  });

});
