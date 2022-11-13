/* eslint-disable @typescript-eslint/no-var-requires */

import { Endpoint, wrap } from 'comlink';
import { NodeEndpoint } from 'comlink/dist/umd/node-adapter';
import { firstValueFrom } from 'rxjs';
import { Kernel } from '../kernel/kernel';
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
export function Spawn(
  worker: string | Endpoint | NodeEndpoint,
  source?: string
) {

  /**
   * @param prototype - Prototype to be decorated.
   * @param propertyKey - Prototype property to be decorated.
   * @throws ReferenceError.
   */
  return function(
    prototype: object,
    propertyKey: PropertyKey
  ): void {
    let thread;

    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get: () => thread ||= (async() => {
        if (TypeOf.process(globalThis.process)) {
          if (TypeOf.string(worker)) {
            const { Worker } = require('worker_threads');
            worker = new Worker(require.resolve(worker));
          }

          const nodeAdapter = require('comlink/dist/umd/node-adapter');
          worker = nodeAdapter(worker);
        } else if (TypeOf.string(worker)) {
          const kernel = new Kernel();
          source ||= `${kernel.nodeModules}/${worker}`;
          const module = await firstValueFrom(kernel.resolve(worker, source));

          if (!globalThis.sgrud && module.exports) {
            worker = new Worker(`${source}/${module.exports}`, {
              type: 'module'
            });
          } else if (globalThis.sgrud && module.unpkg) {
            worker = new Worker(`${source}/${module.unpkg}`, {
              type: 'classic'
            });
          } else {
            throw new ReferenceError(module.name);
          }
        }

        return wrap(worker as Endpoint);
      })(),
      set: Function.prototype as (...args: any[]) => void
    });
  };

}
