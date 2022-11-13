import { Thread } from '@sgrud/core';

describe('@sgrud/core/thread/thread', () => {

  describe('applying the decorator', () => {
    const apply = () => {
      Thread()(class { });
    };

    it('throws an error in the main thread', () => {
      expect(apply).toThrowError(ReferenceError);
    });
  });

});
