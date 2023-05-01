/* eslint-disable valid-jsdoc */

import { BehaviorSubject, Observable, Subscribable } from 'rxjs';

/**
 * The **Store** namespace contains types and interfaces used and intended to be
 * used in conjunction with the abstract {@link Store} class.
 *
 * @see {@link Store}
 */
export namespace Store {
  /* eslint-disable @typescript-eslint/indent */

  /**
   * This {@link Store} **Action** helper type represents the signatures of all
   * available **Action**s of any given {@link Store} by extracting all methods
   * from the given {@link Store} that return a promisified {@link State} of
   * that given {@link Store}. This {@link State} is interpreted as the next
   * {@link State} after this **Action** was invoked.
   *
   * @typeParam T - The extending {@link Store} {@link InstanceType}.
   */
  export type Action<T extends Store> = {
    [K in Exclude<keyof T, keyof Store<T>>]:
      T[K] extends (...args: []) => (
        State<T> | Promise<State<T>>
      ) ? [K] :
      T[K] extends (...args: [...infer I]) => (
        State<T> | Promise<State<T>>
      ) ? [K, I] :
      never;
  }[Exclude<keyof T, keyof Store<T>>];

  /**
   * The **Driver** helper type is a promisified variant of the built-in
   * {@link Storage} type. This type is utilized by the {@link StateWorker}
   * where it represents one of the available {@link Storage} **Driver**s.
   */
  export type Driver = {
    [K in keyof Storage as string extends K ? never : K]:
      Storage[K] extends (...args: infer I) => infer O
        ? (...args: I) => Promise<O> :
      Promise<Storage[K]>;
  };

  /**
   * The **Effect** helper type represents a `keyof` the {@link Effects} map.
   */
  export type Effect = keyof Effects;

  /**
   * The **Effects** helper type represents the `typeof` the globally available
   * {@link sgrud.state.effects} namespace.
   */
  export type Effects = typeof sgrud.state.effects;

  /**
   * The {@link Store} **State** helper type represents the current **State** of
   * any given {@link Store} by extracting all properties (and dropping any
   * methods) from that given {@link Store}.
   *
   * @typeParam T - The extending {@link Store} {@link InstanceType}.
   */
  export type State<T extends Store> = {
    readonly [P in {
      [K in Exclude<keyof T, keyof Store<T>>]:
        T[K] extends (...args: any[]) => any
          ? never :
        K;
    }[Exclude<keyof T, keyof Store<T>>]]: T[P];
  };

  /**
   * The **States** helper type represents the traversal of {@link Store}s.
   */
  export type States = BehaviorSubject<State<Store>>;

  /**
   * Interface describing the **Type**, i.e., static constructable context, of
   * classes extending the abstract {@link Store} base class.
   *
   * @typeParam T - The extending {@link Store} {@link InstanceType}.
   */
  export interface Type<T extends Store> extends Required<typeof Store> {

    /**
     * Overridden `prototype` signature.
     */
    readonly prototype: T;

    /**
     * Overridden and concretized constructor signature.
     */
    new(): T;

  }

  /* eslint-enable @typescript-eslint/indent */
}

/**
 * Abstract **Store** base class. By extending this **Store** base class and
 * decorating the extending class with the {@link Stateful} decorator, the
 * resulting **Store** will become a functional facade implementing only the
 * {@link dispatch} and well-known `Symbol.observable` methods. This resulting
 * facade provides convenient access to the current and upcoming {@link State}s
 * of the **Store** and its {@link dispatch} method, while, behind the facade,
 * interactions with the {@link BusHandler} to provide an {@link Observable} of
 * the {@link State} changes and the {@link StateHandler} to {@link dispatch}
 * any {@link Action}s will be handled transparently.
 *
 * The same functionality can be achieved by manually supplying a **Store** to
 * the {@link StateHandler} and subscribing to the changes of that **Store**
 * through the {@link BusHandler} while any {@link Action}s also have to be
 * passed manually to the {@link StateHandler}. But the {@link Stateful}
 * decorator should be preferred out of convenience and because invoking the
 * constructor of the **Store** class throws a {@link TypeError}.
 *
 * @typeParam T - The extending {@link Store} {@link InstanceType}.
 *
 * @example
 * A simple `ExampleStore` facade:
 * ```ts
 * import { Stateful, Store } from '@sgrud/state';
 *
 * ⁠@Stateful('io.github.sgrud.store.example', {
 *   property: 'default',
 *   timestamp: Date.now()
 * })
 * export class ExampleStore extends Store<ExampleStore> {
 *
 *   public readonly property!: string;
 *
 *   public readonly timestamp!: number;
 *
 *   public async action(property: string): Promise<Store.State<this>> {
 *     return { ...this, property, timestamp: Date.now() };
 *   }
 *
 * }
 * ```
 *
 * @example
 * Subscribe to the `ExampleStore` facade:
 * ```ts
 * import { ExampleStore } from './example-store';
 *
 * const store = new ExampleStore();
 * from(store).subscribe(console.log);
 * // { property: 'default', timestamp: [...] }
 * ```
 *
 * @example
 * Dispatch an {@link Action} through the `ExampleStore` facade:
 * ```ts
 * import { ExampleStore } from './example-store';
 *
 * const store = new ExampleStore();
 * store.dispatch('action', ['value']).subscribe(console.log);
 * // { property: 'value', timestamp: [...] }
 * ```
 */
export abstract class Store<T extends Store = any> {

  /**
   * Well-known `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} emits all {@link State}s this {@link Store}
   * traverses, i.e., all {@link State}s that result from {@link dispatch}ing
   * {@link Action}s on this {@link Store}.
   *
   * @returns A {@link Subscribable} emitting {@link State} changes.
   * @throws An {@link ReferenceError} when not called {@link Stateful}.
   *
   * @example
   * Subscribe to the `ExampleStore`:
   * ```ts
   * import { ExampleStore } from './example-store';
   *
   * const store = new ExampleStore();
   * from(store).subscribe(console.log);
   * ```
   */
  public [Symbol.observable]: () => Subscribable<Store.State<T>>;

  /**
   * @throws A {@link TypeError} upon construction.
   */
  public constructor() {
    throw new TypeError('Store.constructor');
  }

  /**
   * The **dispatch** method provides a facade to **dispatch** an {@link Action}
   * through the {@link StateHandler} when this {@link Store} was decorated with
   * the {@link Stateful} decorator, otherwise calling this method will throw an
   * {@link ReferenceError}.
   *
   * @param action - A type-guarded {@link Action} to **dispatch**.
   * @returns An {@link Observable} of the resulting {@link State}.
   * @throws An {@link ReferenceError} when not called {@link Stateful}.
   *
   * @example
   * Dispatch an {@link Action} to the `ExampleStore`:
   * ```ts
   * import { ExampleStore } from './example-store';
   *
   * const store = new ExampleStore();
   * store.dispatch('action', ['value']).subscribe();
   * ```
   */
  public dispatch(...action: Store.Action<T>): Observable<Store.State<T>> {
    throw new ReferenceError(action[0] as string);
  }

}
