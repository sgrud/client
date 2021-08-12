import { Thread } from '@sgrud/utils';

describe('@sgrud/utils/thread/spawn', () => {

  @Thread() class Class { }

  describe('applying the decorator', () => {
    it('exposes the worker', () => {
      expect(new Class()).toBeInstanceOf(Class);
    });
  });

});
