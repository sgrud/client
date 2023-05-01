import { expose, Remote } from 'comlink';
import { TypeOf } from '../utility/type-of';

/**
 * Type alias describing an exposed class in a remote context. Represented by
 * wrapping a {@link Remote} in a {@link Promise}. Used and intended to be used
 * in conjunction with the {@link Thread} decorator.
 *
 * @typeParam T - The {@link Remote} **Thread** type.
 *
 * @see {@link Thread}
 */
export type Thread<T> = Promise<Remote<T>>;

/**
 * Class decorator factory. {@link expose}s an instance of the decorated class
 * as {@link Worker} **Thread**.
 *
 * @returns A class constructor decorator.
 *
 * @example
 * ExampleWorker **Thread**:
 * ```ts
 * import { Thread } from '@sgrud/core';
 *
 * ⁠@Thread()
 * export class ExampleWorker {}
 * ```
 *
 * @see {@link Spawn}
 */
export function Thread() {

  /**
   * @param constructor - The class `constructor` to be decorated.
   * @throws A {@link ReferenceError} when the environment is incompatible.
   */
  return function(constructor: new () => any): void {
    if (TypeOf.function(globalThis.importScripts)) {
      expose(new constructor());
    } else if (TypeOf.process(globalThis.process)) {
      const { isMainThread, parentPort } = require('worker_threads');

      if (!isMainThread) {
        const nodeEndpoint = require('comlink/dist/umd/node-adapter');
        expose(new constructor(), nodeEndpoint(parentPort));
      } else {
        throw new TypeError(constructor.name);
      }
    } else {
      throw new TypeError(constructor.name);
    }
  };

}
