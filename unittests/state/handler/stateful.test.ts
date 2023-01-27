import { Linker, Symbol } from '@sgrud/core';
import { Stateful, StateHandler, Store } from '@sgrud/state';
import { of } from 'rxjs';

describe('@sgrud/state/handler/stateful', () => {

  StateHandler[Symbol.observable] = () => of<any>({ deploy });
  const deploy = jest.fn(() => of(state));
  const handle = 'sgrud.test.store.class';
  const state = { param: 'default' };

  @Stateful<typeof Class>(handle, state)
  class Class extends Store<Class> { }

  describe('applying the decorator', () => {
    const linker = new Linker<typeof Class>();

    const deployed = [
      handle,
      Class,
      state,
      false
    ];

    it('deploys the decorated class as store', () => {
      expect(deploy).toHaveBeenCalledWith(...deployed);
      expect(linker.get(Class)).toBe(state);
    });
  });

});
