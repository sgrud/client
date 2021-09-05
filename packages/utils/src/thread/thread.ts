/* eslint-disable @typescript-eslint/no-var-requires */

import { expose, Remote } from 'comlink';
import { TypeOf } from '../typing/type-of';

/**
 * Type representing an exposed class in a remote context. Created by wrapping
 * {@link https://www.npmjs.com/package/comlink#typescript|comlink.Remote} in a
 * Promise. Use in conjnction with the `@Thread()` decorator.
 *
 *
 * @typeParam T - Thread instance type.
 */
export type Thread<T> = Promise<Remote<T>>;

/**
 * Class decorator factory. Exposes the decorated class as worker via
 * {@link https://www.npmjs.com/package/comlink#api|comlink.expose}.
 *
 * @returns Class decorator.
 *
 * @example WebWorker thread.
 * ```ts
 * import { Thread } from '@sgrud/utils';
 *
 * @Thread()
 * export class WebWorker { }
 * ```
 *
 * @see {@link Spawn}
 */
export function Thread() {

  /**
   * @param constructor - Class constructor to be decorated.
   */
  return function(
    constructor: new (...args: any[]) => any
  ): void {
    if (TypeOf.function(globalThis.importScripts)) {
      expose(constructor);
    } else if (TypeOf.process(globalThis.process)) {
      const nodeEndpoint = require('comlink/dist/umd/node-adapter.min');
      const { isMainThread, parentPort } = require('worker_threads');

      if (!isMainThread) {
        expose(constructor, nodeEndpoint(parentPort));
      }
    }
  };

}
