/* eslint-disable @typescript-eslint/no-var-requires */

import { wrap } from 'comlink';
import { TypeOf } from '../utility/type-of';

/**
 * Class property decorator factory. Spawns a worker process, wraps it with
 * [comlink.wrap](https://www.npmjs.com/package/comlink#api) and assigns it to
 * the decorated class property.
 *
 * @param workerFactory - Worker constructor.
 * @param factoryArgs - Worker constructor arguments.
 * @typeParam T - Worker constructor type.
 * @returns Class property decorator.
 *
 * @example Spawn a WebWorker.
 * ```ts
 * import type { Thread } from '@sgrud/core';
 * import { Spawn } from '@sgrud/core';
 * import WebWorkerThread from 'worker:./web-worker';
 * import { WebWorker } from './web-worker';
 *
 * export class WebWorkerHandler {
 *
 *   @Spawn(WebWorkerThread)
 *   private static readonly worker: Thread<WebWorker>;
 *
 * }
 * ```
 *
 * @see {@link Thread}
 */
export function Spawn<T extends new (...args: any[]) => Worker>(
  workerFactory: T,
  factoryArgs?: ConstructorParameters<T>
) {

  /**
   * @param constructor - Class constructor to be decorated.
   * @param propertyKey - Class property to be decorated.
   */
  return function(
    constructor: new (...args: any[]) => any,
    propertyKey: PropertyKey
  ): void {
    const worker = new workerFactory();
    let remote = wrap<typeof workerFactory>(worker);

    if (TypeOf.process(globalThis.process)) {
      const nodeEndpoint = require('comlink/dist/umd/node-adapter.min');
      remote = wrap(nodeEndpoint(worker));
    }

    Object.defineProperty(constructor, propertyKey, {
      enumerable: true,
      value: new remote(...factoryArgs || [])
    });
  };

}
