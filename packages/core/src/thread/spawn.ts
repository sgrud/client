import { Endpoint, Remote, wrap } from 'comlink';
import { NodeEndpoint } from 'comlink/dist/umd/node-adapter';
import { firstValueFrom } from 'rxjs';
import { Kernel } from '../kernel/kernel';
import { TypeOf } from '../utility/type-of';

/**
 * This prototype property decorator factory **Spawn**s a {@link Worker} and
 * {@link wrap}s and assigns the resulting {@link Remote} to the decorated
 * prototype property.
 *
 * @param worker - The `worker` module name or {@link Endpoint} to **Spawn**.
 * @param source - An optional {@link Kernel.Module} `source`.
 * @returns A prototype property decorator.
 *
 * @example
 * **Spawn** a {@link Worker}:
 * ```ts
 * import { Spawn, type Thread } from '@sgrud/core';
 * import { type ExampleWorker } from 'example-worker';
 *
 * export class ExampleWorkerHandler {
 *
 *   ⁠@Spawn('example-worker')
 *   public readonly worker!: Thread<ExampleWorker>;
 *
 * }
 * ```
 *
 * @see {@link Thread}
 */
export function Spawn(
  worker: string | Endpoint | NodeEndpoint,
  source?: string
) {

  /**
   * @param prototype - The `prototype` to be decorated.
   * @param propertyKey - The `prototype` property to be decorated.
   * @throws A {@link ReferenceError} when the environment is incompatible.
   */
  return function(prototype: object, propertyKey: PropertyKey): void {
    let thread;

    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get: (): Remote<unknown> => thread ||= (async() => {
        if (TypeOf.process(globalThis.process)) {
          if (TypeOf.string(worker)) {
            const { Worker } = require('worker_threads');
            worker = new Worker(require.resolve(worker));
          }

          const nodeEndpoint = require('comlink/dist/umd/node-adapter');
          worker = nodeEndpoint(worker);
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
      set: Function.prototype as (...args: any[]) => any
    });
  };

}
