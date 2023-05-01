import { Symbol } from '@sgrud/core';
import { Implant, StateHandler, Store } from '@sgrud/state';
import { of } from 'rxjs';

describe('@sgrud/state/handler/implant', () => {

  /*
   * Fixtures
   */

  afterEach(() => mock.mockClear());
  const mock = jest.fn(() => of(undefined));

  StateHandler[Symbol.observable] = () => of<any>({ implant: mock });

  /*
   * Variables
   */

  @Implant('test')
  class Class {

    public function(): Store.Effects['test'] {
      return Function.prototype as (...args: any[]) => any;
    }

  }

  /*
   * Unittests
   */

  describe('applying the decorator', () => {
    const effect = new Class().function.call(undefined!);

    it('implants the decorated class as effect', () => {
      expect(effect).not.toThrow();
      expect(mock).toBeCalledWith('test', Class);
    });
  });

});
