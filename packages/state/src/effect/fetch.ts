import { Implant } from '../handler/implant';
import { Store } from '../store/store';
import { StateWorker } from '../worker';
import { Effect } from './effect';

declare global {
  namespace sgrud.state.effects {

    /**
     * @param requestInfo -
     * @param requestInit -
     * @returns .
     */
    function fetch(
      requestInfo: RequestInfo | URL,
      requestInit?: RequestInit
    ): Promise<Response>;

  }
}

/**
 * [Implant]: https://sgrud.github.io/client/functions/state.Implant
 *
 * @decorator [Implant][]
 */
@Implant('fetch')
export class FetchEffect extends Effect {

  /**
   * @param this - Polymorphic `this`.
   * @returns .
   */
  public override function(this: StateWorker): Store.Effects['fetch'] {
    return (requestInfo, requestInit) => {
      return fetch(requestInfo, requestInit);
    };
  }

}
