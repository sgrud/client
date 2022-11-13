/* eslint-disable @typescript-eslint/no-var-requires */

import { expose, Remote } from 'comlink';
import { TypeOf } from '../utility/type-of';

/**
 * Type alias describing an exposed class in a remote context. Created by
 * wrapping a [Comlink][] *Remote* in a *Promise*. Used and intended to be used
 * in conjunction with the [Thread][] decorator.
 *
 * [Comlink]: https://www.npmjs.com/package/comlink
 * [Thread]: https://sgrud.github.io/client/functions/core.Thread-1
 *
 * @typeParam T - Instance type.
 *
 * @see [Thread][]
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Thread<T> extends Promise<Remote<T>> { }

/**
 * Class decorator factory. Exposes an instance of the decorated class as
 * [Worker][] **Thread** via [Comlink][].
 *
 * @returns Class decorator.
 *
 * [Comlink]: https://www.npmjs.com/package/comlink
 * [Spawn]: https://sgrud.github.io/client/functions/core.Spawn
 * [Worker]: https://developer.mozilla.org/docs/Web/API/Worker/Worker
 *
 * @example
 * ExampleWorker **Thread**:
 * ```ts
 * import { Thread } from '@sgrud/core';
 *
 * ⁠@Thread()
 * export class ExampleWorker { }
 * ```
 *
 * @see [Spawn][]
 */
export function Thread() {

  /**
   * @param constructor - Class constructor to be decorated.
   * @throws ReferenceError.
   */
  return function(
    constructor: new (...args: any[]) => any
  ): void {
    if (TypeOf.function(globalThis.importScripts)) {
      expose(constructor);
    } else if (TypeOf.process(globalThis.process)) {
      const { isMainThread, parentPort } = require('worker_threads');
      const nodeEndpoint = require('comlink/dist/umd/node-adapter.min');

      if (!isMainThread) {
        expose(constructor, nodeEndpoint(parentPort));
      }
    }
  };

}
