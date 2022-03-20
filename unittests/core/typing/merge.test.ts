import { Merge } from '@sgrud/core';

describe('@sgrud/core/typing/merge', () => {

  const object = { };

  describe('assigning to an unknown property merged with a known one', () => {
    const merge = object as Merge<typeof object | { value?: null }>;

    it('compiles and runs without an error', () => {
      expect(merge.value = null).toBeNull();
    });
  });

});
