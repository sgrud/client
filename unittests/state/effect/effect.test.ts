import { Effect } from '@sgrud/state';

describe('@sgrud/state/effect/effect', () => {

  class Class extends Effect {
    public function() {
      return;
    }
  }

  describe('constructing a new instance of an effect', () => {
    const construct = () => new Class();

    it('correctly throws a TypeError', () => {
      expect(construct).toThrowError(TypeError);
    });
  });

});
