import { Mutable } from '@sgrud/core';

describe('@sgrud/core/typing/mutable', () => {

  /*
   * Variables
   */

  const object = {} as { readonly value?: null };

  /*
   * Unittests
   */

  describe('assigning to a readonly property marked as mutable', () => {
    const result = object as Mutable<typeof object>;

    it('compiles and runs without an error', () => {
      expect(result.value = null).toBeNull();
    });
  });

});
