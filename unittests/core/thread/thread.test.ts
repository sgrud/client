import { Thread } from '@sgrud/core';

describe('@sgrud/core/thread/thread', () => {

  @Thread()
  class Class { }

  describe('applying the decorator', () => {
    it('exposes the worker to the main thread', () => {
      expect(new Class()).toBeInstanceOf(Class);
    });
  });

});
