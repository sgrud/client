import { Thread } from '@sgrud/utils';

@Thread()
class Class {

}

describe('@sgrud/utils/thread/spawn', () => {

  describe('applying the decorator', () => {
    it('exposes the worker', () => {
      expect(new Class()).toBeInstanceOf(Class);
    });
  });

});
