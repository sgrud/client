import { StateWorker } from '../handler/handler';
import { Implant } from '../handler/implant';
import { Store } from '../store/store';
import { Effect } from './effect';

declare global {
  namespace sgrud.state.effects {

    /**
     * {@link Implant}ed {@link FetchEffect} providing convenient access to the
     * {@link globalThis.fetch} method within {@link Store.Action}s. Prefer the
     * usage of this {@link Effect} over the {@link globalThis.fetch} method
     * when {@link StateWorker.dispatch}ing {@link Store.Action}s.
     *
     * @param requestInfo - The {@link RequestInfo} or {@link URL} to **fetch**.
     * @param requestInit - An optional {@link RequestInit} object.
     * @returns A {@link Promise} of the **fetch**ed {@link Response}.
     *
     * @example
     * Invoke **fetch** within an {@link Store.Action}:
     * ```ts
     * import { Stateful, Store } from '@sgrud/state';
     *
     * ⁠@Stateful('io.github.sgrud.store.example', { response: undefined })
     * export class ExampleStore extends Store<ExampleStore> {
     *
     *   public readonly response?: unknown;
     *
     *   public async getResponse(url: string): Promise<Store.State<this>> {
     *     const request = await sgrud.state.effects.fetch(url);
     *     const response = await request.json();
     *
     *     if (!request.ok) {
     *       throw response;
     *     }
     *
     *     return { ...this, response };
     *   }
     *
     * }
     * ```
     *
     * @see {@link FetchEffect}
     */
    function fetch(
      requestInfo: RequestInfo | URL,
      requestInit?: RequestInit
    ): Promise<Response>;

  }
}

/**
 * Built-in **FetchEffect** extending the abstract {@link Effect} base class.
 * This **FetchEffect** is automatically {@link StateWorker.implant}ed when the
 * `@sgrud/state` module is imported and can therefore be always used in
 * {@link Store.Action}s.
 *
 * @decorator {@link Implant}
 *
 * @see {@link Effect}
 */
@Implant('fetch')
export class FetchEffect extends Effect {

  /**
   * Overridden **function** binding the {@link FetchEffect} to the polymorphic
   * `this` of the {@link StateWorker}.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @returns This {@link FetchEffect} bound to the {@link StateWorker}.
   */
  public override function(this: StateWorker): Store.Effects['fetch'] {
    return async(requestInfo, requestInit) => {
      return await fetch(requestInfo, requestInit);
    };
  }

}
