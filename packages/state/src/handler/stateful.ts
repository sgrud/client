import { Bus, BusHandler } from '@sgrud/bus';
import { Symbol } from '@sgrud/core';
import { Observable, ReplaySubject, connectable, dematerialize, from, switchMap } from 'rxjs';
import { Store } from '../store/store';
import { StateHandler } from './handler';

/**
 * The **Stateful** decorator, when applied to classes extending the abstract
 * {@link Store} base class, converts those extending classes into type-guarding
 * {@link Store} facades implementing only the {@link Store.dispatch} and the
 * well-known `Symbol.observable` methods. This resulting facade provides
 * convenient access to the current and upcoming {@link Store.State}s of the
 * decorated {@link Store} and its {@link Store.dispatch} method. The decorated
 * class is {@link StateHandler.deploy}ed under the supplied `handle` using the
 * supplied `state` as an initial {@link Store.State}. If the {@link Store} is
 * to be {@link StateHandler.deploy}ed `transient`ly, the supplied `state` is
 * guaranteed to be used as initial {@link Store.State}. Otherwise, a previously
 * persisted {@link Store.State} takes precedence over the supplied `state`.
 *
 * @param handle - The {@link Bus.Handle} representing the {@link Store}.
 * @param state - An initial {@link Store.State} for the {@link Store}.
 * @param transient - Whether the {@link Store} is considered `transient`.
 * @typeParam I - The extending {@link Store} {@link InstanceType}.
 * @typeParam T - A constructor type extending the {@link Store.Type}.
 * @returns A class constructor decorator.
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
 * Dispatch an {@link Store.Action} through the `ExampleStore` facade:
 * ```ts
 * import { ExampleStore } from './example-store';
 *
 * const store = new ExampleStore();
 * store.dispatch('action', ['value']).subscribe(console.log);
 * // { property: 'value', timestamp: [...] }
 * ```
 * @see {@link StateHandler}
 * @see {@link Implant}
 */
export function Stateful<
  T extends Store.Type<I>,
  I extends Store = InstanceType<T>
>(handle: Bus.Handle, state: Store.State<I>, transient: boolean = false) {

  /**
   * @param constructor - The class `constructor` to be decorated.
   * @returns The decorated class `constructor`.
   */
  return function(constructor: T): T {
    let loader: Observable<void>;

    (loader = connectable(from(StateHandler).pipe(switchMap((handler) => {
      return handler.deploy(handle, constructor, state, transient);
    })), {
      connector: () => new ReplaySubject<void>(1),
      resetOnDisconnect: false
    })).connect();

    return class {

      public [Symbol.observable]() {
        return loader.pipe(switchMap(() => from(BusHandler).pipe(
          switchMap((handler) => handler.observe(handle).pipe(dematerialize()))
        )));
      }

      public dispatch(...action: Store.Action<I>) {
        return loader.pipe(switchMap(() => from(StateHandler).pipe(
          switchMap((handler) => handler.dispatch<I>(handle, ...action))
        )));
      }

    } as unknown as T;
  };

}
