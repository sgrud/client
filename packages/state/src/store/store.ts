import { Symbol } from '@sgrud/core';
import { Observable, Subscribable } from 'rxjs';

/**
 *
 */
export namespace Store {
  /* eslint-disable @typescript-eslint/indent */

  /**
   *
   */
  export type Action<T extends Store> = {
    [K in Exclude<keyof T, keyof Store<T>>]:
      T[K] extends (...args: []) => (
        Store.State<T> | Promise<Store.State<T>>
      ) ? [K] :
      T[K] extends (...args: [...infer I]) => (
        Store.State<T> | Promise<Store.State<T>>
      ) ? [K, I] :
      never;
  }[Exclude<keyof T, keyof Store<T>>];

  /**
   *
   */
  export type State<T extends Store> = {
    readonly [P in {
      [K in Exclude<keyof T, keyof Store<T>>]:
        T[K] extends (...args: any[]) => any ? never : K;
    }[Exclude<keyof T, keyof Store<T>>]]: T[P];
  };

  /**
   *
   */
  export interface Type<T extends Store> extends Required<typeof Store> {

    /**
     * Overridden and concretized constructor signature.
     */
    new (): T;

  }

  /* eslint-enable @typescript-eslint/indent */
}

/**
 *
 */
export abstract class Store<T extends Store = any> {

  /**
   *
   */
  public readonly [Symbol.observable]: () => Subscribable<Store.State<T>>;

  /**
   * @throws TypeError.
   */
  public constructor() {
    throw new TypeError();
  }

  /**
   * @param action -
   * @throws ReferenceError.
   */
  public dispatch(...action: Store.Action<T>): Observable<Store.State<T>> {
    throw new ReferenceError(action[0] as string);
  }

}
