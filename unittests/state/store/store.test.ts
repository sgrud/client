import { Store } from '@sgrud/state';
import { from } from 'rxjs';

describe('@sgrud/state/store/store', () => {

  /*
   * Variables
   */

  class Class extends Store<Class> {

    public readonly param?: string;

    public setParam(param: string): Store.State<this> {
      return { ...this, param };
    }

  }

  /*
   * Unittests
   */

  describe('constructing a new instance of a store', () => {
    const construct = () => new Class();

    it('correctly throws an error', () => {
      expect(construct).toThrowError(TypeError);
    });
  });

  describe('dispatching an action on a store', () => {
    const dispatch = () => Class.prototype.dispatch('setParam', ['value']);

    it('correctly throws an error', () => {
      expect(dispatch).toThrowError(ReferenceError);
    });
  });

  describe('subscribing to a store through rxjs', () => {
    const subscribe = () => from(Class.prototype).subscribe();

    it('correctly throws an error through rxjs', () => {
      expect(subscribe).toThrowError(TypeError);
    });
  });

});
