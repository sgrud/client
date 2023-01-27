import { Symbol } from '@sgrud/core';
import { Implant, StateHandler, Store } from '@sgrud/state';
import { of } from 'rxjs';

declare global {
  namespace sgrud.state.effects {
    function test(): void;
  }
}

describe('@sgrud/state/handler/implant', () => {

  StateHandler[Symbol.observable] = () => of<any>({ implant });
  const implant = jest.fn(() => of(undefined));
  const invoke = jest.fn();

  @Implant('test')
  class Class {
    public function(): Store.Effects['test'] {
      return invoke;
    }
  }

  describe('applying the decorator', () => {
    const effect = new Class().function.apply(undefined!);

    it('implants the decorated class as effect', () => {
      expect(effect).not.toThrow();
      expect(implant).toHaveBeenCalled();
      expect(invoke).toHaveBeenCalled();
    });

  });

});
