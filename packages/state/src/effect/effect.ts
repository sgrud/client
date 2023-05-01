/* eslint-disable tsdoc/syntax */

import { StateWorker } from '../handler/handler';
import { Store } from '../store/store';

declare global {

  /**
   * Global [SGRUD](https://sgrud.github.io) namespace.
   */
  namespace sgrud {

    /**
     * `@sgrud/state` - The [SGRUD](https://sgrud.github.io) State Machine.
     */
    namespace state {

      /**
       * Global **effects** namespace. Within this namespace **effects** are
       * provided by the {@link Implant} decorator to the {@link StateWorker}.
       */
      namespace effects {}

    }

  }

}

/**
 * Abstract **Effect** base class. When this class is extended and decorated
 * with the {@link Implant} decorator or {@link StateWorker.implant}ed through
 * the {@link StateHandler}, its {@link function} will be made available to
 * {@link Store.Action}s through the global {@link sgrud.state.effects}
 * namespace.
 *
 * @typeParam K - The {@link Store.Effect} `locate` type.
 *
 * @example
 * An `importScripts` **Effect**:
 * ```ts
 * import { Effect, Implant, type StateWorker, type Store } from '@sgrud/state';
 *
 * declare global {
 *   namespace sgrud.state.effects {
 *     function importScripts(...urls: (string | URL)[]): Promise<void>;
 *   }
 * }
 *
 * ⁠@Implant('importScripts')
 * export class FetchEffect extends Effect {
 *
 *   public override function(
 *     this: StateWorker
 *   ): Store.Effects['importScripts'] {
 *     return async(...urls) => {
 *       return importScripts(...urls);
 *     };
 *   }
 *
 * }
 * ```
 */
export abstract class Effect<K extends Store.Effect = Store.Effect> {

  /**
   * Public **constructor** (which should never be called).
   *
   * @throws A {@link TypeError} upon construction.
   */
  public constructor() {
    throw new TypeError('Effect.constructor');
  }

  /**
   * Abstract **function** responsible for returning the bound {@link Effect}.
   * When an {@link StateWorker.implant}ed {@link Effect} is invoked, it is
   * bound to the polymorphic `this` of the {@link StateWorker} upon invocation.
   * This **function** provides the means of interacting with this bond, as in,
   * utilizing the polymorphic `this` of the {@link StateWorker} to provide the
   * bound {@link Effect}, e.g., by utilizing `protected` properties and methods
   * of the bound-to {@link StateWorker}.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @returns This {@link Effect} bound to the {@link StateWorker}.
   */
  public abstract function(this: StateWorker): Store.Effects[K];

}
