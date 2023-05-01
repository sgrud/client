import { Bus } from '@sgrud/bus';
import { StateWorker } from '../handler/handler';
import { Implant } from '../handler/implant';
import { Store } from '../store/store';
import { Effect } from './effect';

declare global {
  namespace sgrud.state.effects {

    /**
     * {@link Implant}ed {@link StateEffect} providing convenient access to the
     * **state** of {@link Store}s from within {@link StateWorker.dispatch}ed
     * {@link Store.Action}s. This {@link StateEffect} in combination with the
     * {@link DispatchEffect} can be used to implement complex interactions
     * between different {@link Store}s.
     *
     * @param handle - The {@link Bus.Handle} representing the {@link Store}.
     * @typeParam T - The extending {@link Store} {@link InstanceType}.
     * @returns The current **state** of the {@link Store}.
     *
     * @example
     * Retrieve the **state** from another {@link Store}:
     * ```ts
     * import { type Bus } from '@sgrud/bus';
     * import { Stateful, Store } from '@sgrud/state';
     *
     * ⁠@Stateful('io.github.sgrud.store.example', { state: undefined })
     * export class ExampleStore extends Store<ExampleStore> {
     *
     *   public readonly state?: Store.State<Store>;
     *
     *   public async getState(handle: Bus.Handle): Promise<Store.State<this>> {
     *     const state = await sgrud.state.effects.state(handle);
     *
     *     return { ...this, state };
     *   }
     *
     * }
     * ```
     *
     * @see {@link StateEffect}
     */
    function state<T extends Store>(
      handle: Bus.Handle
    ): Promise<Store.State<T> | undefined>;

  }
}

/**
 * Built-in **StateEffect** extending the abstract {@link Effect} base class.
 * This **StateEffect** is automatically {@link StateWorker.implant}ed when the
 * `@sgrud/state` module is imported and can therefore be always used in
 * {@link Store.Action}s.
 *
 * @decorator {@link Implant}
 *
 * @see {@link Effect}
 */
@Implant('state')
export class StateEffect extends Effect {

  /**
   * Overridden **function** binding the {@link StateEffect} to the polymorphic
   * `this` of the {@link StateWorker}.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @returns This {@link StateEffect} bound to the {@link StateWorker}.
   */
  public override function(this: StateWorker): Store.Effects['state'] {
    return async(handle) => {
      const state = this.states.get(handle)?.has(this)
        ? this.states.get(handle)?.get(this)
        : this.states.get(handle)?.get(self);

      return state?.value as Store.State<any>;
    };
  }

}
