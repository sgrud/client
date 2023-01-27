import { BusHandle } from '@sgrud/bus';
import { Implant } from '../handler/implant';
import { Store } from '../store/store';
import { StateWorker } from '../worker';
import { Effect } from './effect';

declare global {
  namespace sgrud.state.effects {

    /**
     * @param handle -
     * @param action -
     * @typeParam T -
     * @returns .
     */
    function dispatch<T extends Store>(
      handle: BusHandle,
      ...action: Store.Action<T>
    ): Promise<Store.State<T>>;

  }
}

/**
 * [Implant]: https://sgrud.github.io/client/functions/state.Implant
 *
 * @decorator [Implant][]
 */
@Implant('dispatch')
export class DispatchEffect extends Effect {

  /**
   * @param this - Polymorphic `this`.
   * @returns .
   */
  public override function(this: StateWorker): Store.Effects['dispatch'] {
    return (handle, ...action) => {
      return this.dispatch(handle, action as Store.Action<any>);
    };
  }

}
