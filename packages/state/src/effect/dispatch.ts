import { Bus } from '@sgrud/bus';
import { StateWorker } from '../handler/handler';
import { Implant } from '../handler/implant';
import { Store } from '../store/store';
import { Effect } from './effect';

declare global {
  namespace sgrud.state.effects {

    /**
     * {@link Implant}ed {@link DispatchEffect} providing a convenient way to
     * **dispatch** {@link Store.Action}s from within {@link Store.Action}s.
     * This {@link DispatchEffect} in combination with the {@link StateEffect}
     * can be used to implement complex interactions between different
     * {@link Store}s.
     *
     * @param handle - The {@link Bus.Handle} representing the {@link Store}.
     * @param action - A type-guarded {@link Store.Action} to **dispatch**.
     * @typeParam T - The extending {@link Store} {@link InstanceType}.
     * @returns The next {@link Store.State} after **dispatch**ing.
     *
     * @example
     * **dispatch** an {@link Store.Action} to another {@link Store}:
     * ```ts
     * import { type Bus } from '@sgrud/bus';
     * import { Stateful, Store } from '@sgrud/state';
     *
     * ⁠@Stateful('io.github.sgrud.store.example', { state: undefined })
     * export class ExampleStore extends Store<ExampleStore> {
     *
     *   public readonly state?: Store.State<Store>;
     *
     *   public async dispatchAction<T extends Store>(
     *     handle: Bus.Handle,
     *     ...action: Store.Action<T>
     *   ): Promise<Store.State<this>> {
     *     const state = await sgrud.state.effects.dispatch<T>(
     *       handle, ...action
     *     );
     *
     *     return { ...this, state };
     *   }
     *
     * }
     * ```
     *
     * @see {@link DispatchEffect}
     */
    function dispatch<T extends Store>(
      handle: Bus.Handle,
      ...action: Store.Action<T>
    ): Promise<Store.State<T>>;

  }
}

/**
 * Built-in **DispatchEffect** extending the abstract {@link Effect} base class.
 * This **DispatchEffect** is automatically {@link StateWorker.implant}ed when
 * the `@sgrud/state` module is imported and can therefore be always used in
 * {@link Store.Action}s.
 *
 * @decorator {@link Implant}
 *
 * @see {@link Effect}
 */
@Implant('dispatch')
export class DispatchEffect extends Effect {

  /**
   * Overridden **function** binding the {@link DispatchEffect} to the
   * polymorphic `this` of the {@link StateWorker}.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @returns This {@link DispatchEffect} bound to the {@link StateWorker}.
   */
  public override function(this: StateWorker): Store.Effects['dispatch'] {
    return async(handle, ...action) => {
      return await this.dispatch(handle, action);
    };
  }

}
