import { Assign } from '@sgrud/core';

describe('@sgrud/core/typing/assign', () => {

  const object = { } as { value: never };

  describe('assigning to an unknown property overridden by a known one', () => {
    const assign = object as Assign<{ value?: null }, typeof object>;

    it('compiles and runs without an error', () => {
      expect(assign.value = null).toBeNull();
    });
  });

});
