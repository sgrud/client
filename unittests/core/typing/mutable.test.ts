import { Mutable } from '@sgrud/core';

describe('@sgrud/core/typing/mutable', () => {

  const object = { } as { readonly value?: null };

  describe('assigning to a readonly property marked as mutable', () => {
    const mutable = object as Mutable<typeof object>;

    it('compiles and runs without an error', () => {
      expect(mutable.value = null).toBeNull();
    });
  });

});
