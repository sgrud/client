import { Store } from '@sgrud/state';
import { from } from 'rxjs';

describe('@sgrud/state/store/store', () => {

  class Class extends Store<Class> {
    public readonly param?: string;
    public setParam(param: string): Store.State<this> {
      return { ...this, param };
    }
  }

  describe('Constructing a new instance of a store', () => {
    const construct = () => new Class();

    it('Correctly throws a TypeError', () => {
      expect(construct).toThrowError(TypeError);
    });
  });

  describe('Dispatching an action on a store', () => {
    const dispatch = () => Class.prototype.dispatch('setParam', ['value']);

    it('Correctly throws a ReferenceError', () => {
      expect(dispatch).toThrowError(ReferenceError);
    });
  });

  describe('Subscribing to a store', () => {
    const state = () => from(Class.prototype).subscribe();

    it('Correctly throws a TypeError through rxjs', () => {
      expect(state).toThrowError(TypeError);
    });
  });

});
