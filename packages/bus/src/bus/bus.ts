import { Alias, Symbol } from '@sgrud/core';
import { Observable, ObservableNotification, Observer, ReplaySubject, Subject, Subscribable, Unsubscribable, connectable, dematerialize, filter, from, map, switchMap } from 'rxjs';
import { BusHandler } from '../handler/handler';

/**
 * The **Bus** namespace contains types and interfaces used and intended to be
 * used in conjunction with the {@link Singleton} {@link BusHandler} class. This
 * namespace contains the {@link Handle} string literal type helper, designating
 * the hierarchical mount-point of any **Bus**, as well as the {@link Value}
 * type helper, describing the data and state a **Bus** may transport.
 *
 * @see {@link Bus}
 */
export namespace Bus {

  /**
   * The **Handle** string literal helper type enforces any assigned value to
   * contain at least three dots. It represents a type constraint which should
   * be thought of as domain name in reverse notation. All employed **Handle**s
   * thereby designate a hierarchical structure, which the {@link BusHandler} in
   * conjunction with the {@link BusWorker} operate upon.
   *
   * @example
   * Library-wide **Handle**:
   * ```ts
   * import { type Bus } from '@sgrud/bus';
   *
   * const busHandle: Bus.Handle = 'io.github.sgrud';
   * ```
   *
   * @example
   * An invalid **Handle**:
   * ```ts
   * import { type Bus } from '@sgrud/bus';
   *
   * const busHandle: Bus.Handle = 'org.example';
   * // Type [...] is not assignable to type 'Handle'.
   * ```
   *
   * @see {@link BusHandler}
   */
  export type Handle = Alias<`${string}.${string}.${string}`>;

  /**
   * The **Value** type helper extends the {@link ObservableNotification} type
   * and describes the shape of all values emitted by any stream handled by the
   * {@link BusHandler}. As those streams are {@link Observable}s, which are
   * dynamically combined through their hierarchical structure denoted by their
   * corresponding {@link Handle}s and therefore may emit from more than one
   * {@link Handle}, each **Value** emitted by any bus contains its originating
   * {@link Handle}.
   *
   * @typeParam T - The {@link Bus} **Value** type.
   *
   * @example
   * Logging emitted **Value**s:
   * ```ts
   * import { BusHandler } from '@sgrud/bus';
   *
   * const busHandler = new BusHandler();
   * busHandler.observe('io.github.sgrud').subscribe(console.log);
   * // { handle: 'io.github.sgrud.example', type: 'N', value: 'published' }
   * ```
   *
   * @see {@link BusHandler}
   */
  export type Value<T> = ObservableNotification<T> & {

    /**
     * The emitting {@link Handle}.
     */
    readonly handle: Handle;

  };

}

/**
 * The **Bus** class presents an easy way to establish duplex streams. Through
 * the on-construction supplied {@link Handle} the mount point of the created
 * duplex streaming **Bus** within the hierarchical structure of streams handled
 * by the {@link BusHandler} is designated. Thereby, all {@link Value}s emitted
 * by the created **Bus** originate from streams beneath the supplied
 * {@link Handle} and when invoking the {@link next} method of the implemented
 * {@link Observer} contract, the resulting {@link Value} will originate from
 * this supplied {@link Handle}.
 *
 * An instantiated **Bus** allows for two modes of observation to facilitate
 * simple and complex use cases. The implemented {@link Subscribable} contract
 * allows for observation of the {@link dematerialize}d {@link Value}s, while
 * the well-known `Symbol.observable` method provides a way to observe the raw
 * {@link Value}s, including their originating {@link Handle}s.
 *
 * @typeParam I - The input value type of a **Bus** instance.
 * @typeParam O - The output value type of a **Bus** instance.
 *
 * @example
 * Using a duplex streaming **Bus**:
 * ```ts
 * import { Bus } from '@sgrud/bus';
 *
 * const bus = new Bus<string, string>('io.github.sgrud.example');
 *
 * bus.subscribe({ next: console.log });
 * bus.next('value');
 * bus.complete();
 * ```
 */
export class Bus<I, O> implements Observer<I>, Subscribable<O> {

  /**
   * The **observe**d side of this {@link Bus}. The {@link Observable} assigned
   * to this property is used to fullfil the {@link Subscribable} contract and
   * is obtained through the {@link BusHandler}.
   */
  private readonly observe: Observable<Bus.Value<O>>;

  /**
   * The **publish**ing side of this {@link Bus}. The {@link Subject} assigned
   * to this property is used to fullfil the {@link Observer} contract and is
   * provided to the {@link BusHandler} for **publish**ment.
   */
  private readonly publish: Subject<I>;

  /**
   * Public {@link Bus} **constructor**. The {@link Handle} supplied to this
   * **constructor** is assigned as `readonly` on the constructed {@link Bus}
   * instance and will be used to determine the mount point of this duplex
   * stream within the hierarchical structure of streams handled by the
   * {@link BusHandler}.
   *
   * @param handle - The {@link Handle} to publish this {@link Bus} under.
   * @typeParam I - The input value type of a **Bus** instance.
   * @typeParam O - The output value type of a **Bus** instance.
   */
  public constructor(

    /**
     * The {@link Handle} to publish this {@link Bus} under.
     */
    public readonly handle: Bus.Handle

  ) {
    const loader = connectable(from(BusHandler).pipe(switchMap((handler) => {
      return handler.publish(handle, this.publish).pipe(map(() => handler));
    })), {
      connector: () => new ReplaySubject<BusHandler>(1),
      resetOnDisconnect: false
    });

    this.observe = loader.pipe(
      switchMap((handler) => handler.observe<O>(handle)),
      filter((value) => value.handle !== handle)
    );

    this.publish = new Subject<I>();
    loader.connect();
  }

  /**
   * Well-known `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} emits the raw {@link Value}s {@link observe}d
   * by this {@link Bus}. By comparison, the implemented {@link subscribe}
   * method of the {@link Subscribable} interface {@link dematerialize}s these
   * raw {@link Value}s before passing them through to the {@link Observer}.
   *
   * @returns A {@link Subscribable} emitting raw {@link Value}s.
   *
   * @example
   * Subscribe to a raw {@link Bus}:
   * ```ts
   * import { Bus } from '@sgrud/bus';
   * import { from } from 'rxjs';
   *
   * const bus = new Bus<string, string>('io.github.sgrud.example');
   * from(bus).subscribe(console.log);
   * ```
   */
  public [Symbol.observable](): Subscribable<Bus.Value<O>> {
    return this.observe;
  }

  /**
   * Implemented **complete** method of the {@link Observer} contract. Invoking
   * this method will mark the {@link publish}ing side of this duplex
   * {@link Bus} as **complete**d.
   *
   * @example
   * **complete** a {@link Bus}:
   * ```ts
   * import { Bus } from '@sgrud/bus';
   *
   * const bus = new Bus<string, string>('io.github.sgrud.example');
   * bus.complete();
   * ```
   */
  public complete(): void {
    this.publish.complete();
  }

  /**
   * Implemented **error** method of the {@link Observer} contract. Invoking
   * this method will throw the supplied `error` on the {@link publish}ing side
   * of this duplex {@link Bus}.
   *
   * @param error - The `error` to {@link publish}.
   *
   * @example
   * Throw an **error** through a {@link Bus}:
   * ```ts
   * import { Bus } from '@sgrud/bus';
   *
   * const bus = new Bus<string, string>('io.github.sgrud.example');
   * bus.error(new Error('example));
   * ```
   */
  public error(error: unknown): void {
    this.publish.error(error);
  }

  /**
   * Implemented **next** method of the {@link Observer} contract. Invoking this
   * method will provide any observer of the {@link publish}ing side of this
   * duplex {@link Bus} with the **next** `value`.
   *
   * @param value - The **next** `value` to {@link publish}.
   *
   * @example
   * Supplying a {@link Bus} with a **next** value:
   * ```ts
   * import { Bus } from '@sgrud/bus';
   *
   * const bus = new Bus<string, string>('io.github.sgrud.example');
   * bus.next('value');
   * ```
   */
  public next(value: I): void {
    this.publish.next(value);
  }

  /**
   * Implemented **subscribe** method of the {@link Subscribable} contract.
   * Invoking this method while supplying an `observer` will **subscribe** the
   * supplied `observer` to any changes on the {@link observe}d side of this
   * duplex {@link Bus}.
   *
   * @param observer - The `observer` to **subscribe** to this {@link Bus}.
   * @returns An {@link Unsubscribable} of the ongoing observation.
   *
   * @example
   * **subscribe** to a {@link dematerialize}d {@link Bus}:
   * ```ts
   * import { Bus } from '@sgrud/bus';
   *
   * const bus = new Bus<string, string>('io.github.sgrud.example');
   * bus.subscribe({ next: console.log });
   * ```
   */
  public subscribe(observer?: Partial<Observer<O>>): Unsubscribable {
    return this.observe.pipe(dematerialize()).subscribe(observer);
  }

}
