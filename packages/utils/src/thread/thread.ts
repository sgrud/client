/* eslint-disable @typescript-eslint/no-var-requires */
import { expose, Remote } from 'comlink';

/**
 * Type representing an exposed class in a remote context. Created by wrapping
 * {@link https://www.npmjs.com/package/comlink#typescript|comlink.Remote} in a
 * Promise.
 *
 *
 * @typeParam T - Instance type.
 */
export type Thread<T> = Promise<Remote<T>>;

/**
 * Class decorator factory. Exposes the decorated class as worker via
 * {@link https://www.npmjs.com/package/comlink#api|comlink.expose}.
 *
 * @returns Generic class decorator.
 *
 * @example WebWorker thread.
 * ```ts
 * import { Thread } from '@sgrud/utils';
 *
 * @Thread()
 * class WebWorker {
 * }
 * ```
 */
export function Thread() {

  /**
   * @param constructor - Class constructor to be decorated.
   * @typeParam T - Class constructor type.
   */
  return function<
    T extends new (...args: any[]) => InstanceType<T>
  >(
    constructor: T
  ): void {
    if (typeof importScripts !== 'undefined') {
      expose(constructor);
    } else if (typeof process !== 'undefined') {
      const nodeEndpoint = require('comlink/dist/umd/node-adapter.min');
      const { isMainThread, parentPort } = require('worker_threads');

      if (!isMainThread) {
        expose(constructor, nodeEndpoint(parentPort));
      }
    }
  };

}
