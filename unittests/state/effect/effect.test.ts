import { Effect } from '@sgrud/state';

describe('@sgrud/state/effect/effect', () => {

  /*
   * Variables
   */

  class Class extends Effect {

    public function(): any {
      return;
    }

  }

  /*
   * Unittests
   */

  describe('constructing a new instance of an effect', () => {
    const construct = () => new Class();

    it('correctly throws an error', () => {
      expect(construct).toThrowError(TypeError);
    });
  });

});
