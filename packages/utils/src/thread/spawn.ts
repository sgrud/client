/* eslint-disable @typescript-eslint/no-var-requires */

import { Remote, wrap } from 'comlink';
import { typeOf } from '../typing/type-of';

/**
 * Class property decorator factory. Spawns a worker process, wraps it with
 * {@link https://www.npmjs.com/package/comlink#api|comlink.wrap} and
 * assignes it to the decorated class property.
 *
 * @param workerFactory - Worker constructor.
 * @param factoryArgs - Worker Constructor arguments.
 * @returns Generic class property decorator.
 *
 * @example Spawn a WebWorker.
 * ```ts
 * import { Spawn, Thread } from '@sgrud/utils';
 * import WebWorkerThread from 'worker:./web-worker';
 * import { WebWorker } from './web-worker';
 *
 * export class WebWorkerHandler {
 *   @Spawn(WebWorkerThread) private static readonly worker: Thread<WebWorker>;
 * }
 * ```
 *
 * @see {@link Thread}
 */
export function Spawn(
  workerFactory: new (...args: any[]) => Worker,
  ...factoryArgs: any[]
) {

  /**
   * @param constructor - Class constructor to be decorated.
   * @param propertyKey - Class property to be decorated.
   * @typeParam T - Class constructor type.
   */
  return function<
    T extends new (...args: any[]) => InstanceType<T>
  >(
    constructor: T,
    propertyKey: PropertyKey
  ): void {
    const worker = new workerFactory();
    let remote: Remote<new (...args: any[]) => Worker> = wrap(worker);

    if (typeOf.process(globalThis.process)) {
      const nodeEndpoint = require('comlink/dist/umd/node-adapter.min');
      remote = wrap(nodeEndpoint(worker));
    }

    Object.defineProperty(constructor, propertyKey, {
      enumerable: true,
      value: new remote(...factoryArgs)
    });
  };

}
