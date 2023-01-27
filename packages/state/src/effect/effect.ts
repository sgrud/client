import { Store } from '../store/store';
import { StateWorker } from '../worker';

declare global {

  /**
   * Global [SGRUD][] namespace.
   *
   * [SGRUD]: https://sgrud.github.io
   */
  namespace sgrud {

    /**
     * `@sgrud/state` - The [SGRUD][] State Machine.
     *
     * [SGRUD]: https://sgrud.github.io
     */
    namespace state {

      /**
       *
       */
      namespace effects { }

    }

  }

}

/**
 * @typeParam K -
 */
export abstract class Effect<K extends keyof Store.Effects = any> {

  /**
   * @throws TypeError.
   */
  public constructor() {
    throw new TypeError();
  }

  /**
   * @param this - Polymorphic `this`.
   * @returns .
   */
  public abstract function(this: StateWorker): Store.Effects[K];

}
