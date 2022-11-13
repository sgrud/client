/* eslint-disable @typescript-eslint/no-var-requires */

import { wrap } from 'comlink';
import { TypeOf } from '../utility/type-of';

/**
 * This prototype property decorator factory **Spawn**s a [Worker][], wraps it
 * with [Comlink][] and assigns it to the decorated prototype property.
 *
 * [Comlink]: https://www.npmjs.com/package/comlink
 * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
 * [Thread]: https://sgrud.github.io/client/functions/core.Thread-1
 * [Worker]: https://developer.mozilla.org/docs/Web/API/Worker/Worker
 *
 * @param worker - Worker constructor to **Spawn**.
 * @param source - Optional [Module][] source.
 * @typeParam T - Constructor type.
 * @returns Class property decorator.
 *
 * @example
 * **Spawn** a [Worker][]:
 * ```ts
 * import { Spawn, Thread } from '@sgrud/core';
 * import { ExampleWorker } from 'example-worker';
 *
 * export class ExampleWorkerHandler {
 *
 *   ⁠@Spawn('example-worker')
 *   private static readonly worker: Thread<ExampleWorker>;
 *
 * }
 * ```
 *
 * @see [Thread][]
 */
export function Spawn<T extends new (...args: any[]) => Worker>(
  workerFactory: T,
  factoryArgs?: ConstructorParameters<T>
) {

  /**
   * @param prototype - Prototype to be decorated.
   * @param propertyKey - Prototype property to be decorated.
   * @throws ReferenceError.
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
