import { Bus, BusHandler } from '@sgrud/bus';
import { Factor, Kernel, Singleton, Symbol, Thread, TypeOf } from '@sgrud/core';
import { Remote, createEndpoint, transfer, wrap } from 'comlink';
import { Observable, ReplaySubject, Subscribable, firstValueFrom, from, fromEvent, map, switchMap } from 'rxjs';
import { Effect } from '../effect/effect';
import { Store } from '../store/store';
import { StateWorker } from '../worker';
import { name } from '../worker/package.json';

/**
 * The **StateHandler** {@link Singleton} class provides the means to interact
 * with an automatically registered {@link ServiceWorker}, when instantiated in
 * a browser environment or, when the **StateHandler** is instantiated within a
 * NodeJS environment, a `new require('worker_threads').Worker()` is forked.
 * Within either of these {@link Thread}s the {@link StateWorker} is executed
 * and handles the {@link deploy}ment of {@link Store}s and {@link dispatch}ing
 * {@link Store.Action}s against them. The same goes for {@link Effect}s, whose
 * {@link implant}ation the {@link StateWorker} handles.
 *
 * The functionality provided by the **StateHandler** is best consumed by
 * applying on of the {@link Stateful} or {@link Implant} decorators, as those
 * provide easier and higher-level interfaces to the functionality provided by
 * this {@link Singleton} class.
 *
 * @decorator {@link Singleton}
 *
 * @see {@link StateWorker}
 */
@Singleton()
export class StateHandler {

  /**
   * Private static {@link ReplaySubject} used as the {@link StateHandler}
   * **loader**. This **loader** emits once after the {@link StateHandler} has
   * been successfully initialized.
   */
  private static loader: ReplaySubject<StateHandler>;

  /**
   * Static `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} mirrors the private {@link loader} and is
   * used for initializations after the {@link StateHandler} has been
   * successfully initialized.
   *
   * @returns A {@link Subscribable} emitting this {@link StateHandler}.
   *
   * @example
   * Subscribe to the {@link StateHandler}:
   * ```ts
   * import { StateHandler } from '@sgrud/state';
   * import { from } from 'rxjs';
   *
   * from(StateHandler).subscribe(console.log);
   * ```
   */
  public static [Symbol.observable](): Subscribable<StateHandler> {
    return this.loader.asObservable();
  }

  /**
   * Static initialization block.
   */
  static {
    this.loader = new ReplaySubject<StateHandler>(1);
  }

  /**
   * The **worker** {@link Thread} is the main background workhorse, depending
   * on the environment, either a `navigator.serviceWorker` is `register`ed or a
   * `new require('worker_threads').Worker()` NodeJS equivalent will be forked.
   *
   * @see {@link StateWorker}
   */
  public readonly worker: Thread<StateWorker>;

  /**
   * {@link Factor}ed-in **handler** property linking the {@link BusHandler}.
   *
   * @decorator {@link Factor}
   */
  @Factor(() => BusHandler)
  private readonly handler!: BusHandler;

  /**
   * {@link Factor}ed-in **kernel** property linking the {@link Kernel}.
   *
   * @decorator {@link Factor}
   */
  @Factor(() => Kernel)
  private readonly kernel!: Kernel;

  /**
   * Public {@link StateHandler} **constructor**. As the {@link StateHandler} is
   * a {@link Singleton} class, this **constructor** is only invoked the first
   * time it is targeted by the `new` operator. Upon this first invocation, the
   * {@link worker} property is assigned an appropriate instance of the
   * {@link StateWorker} {@link Thread}.
   *
   * @param source - An optional {@link Kernel.Module} `source`.
   * @param scope - An optionally `scope`d {@link ServiceWorkerRegistration}.
   * @throws A {@link ReferenceError} when the environment is incompatible.
   */
  public constructor(source?: string, scope?: string) {
    from(this.worker = (async() => {
      let worker: Remote<StateWorker>;

      if (TypeOf.process(globalThis.process)) {
        const nodeEndpoint = require('comlink/dist/umd/node-adapter');
        const { Worker } = require('worker_threads');

        worker = wrap(nodeEndpoint(new Worker(require.resolve(name))));
      } else {
        source ||= `${this.kernel.nodeModules}/${name}`;
        const module = await firstValueFrom(this.kernel.resolve(name, source));

        if (!globalThis.sgrud && module.exports) {
          await navigator.serviceWorker.register(`${source}/${module.exports}`,{
            scope: scope ?? source,
            type: 'module'
          });
        } else if (globalThis.sgrud && module.unpkg) {
          await navigator.serviceWorker.register(`${source}/${module.unpkg}`, {
            scope: scope ?? source,
            type: 'classic'
          });
        } else {
          throw new ReferenceError(module.name);
        }

        const serviceWorker = navigator.serviceWorker.controller! || await (
          firstValueFrom(fromEvent(navigator.serviceWorker, 'controllerchange'))
        ).then(() => navigator.serviceWorker.controller);

        const { port1, port2 } = new MessageChannel();
        serviceWorker.postMessage({ [name]: port1 }, [port1]);
        worker = wrap<StateWorker>(port2);
      }

      const thread = await this.handler.worker;
      const socket = await thread[createEndpoint]();
      await worker.connect(transfer(socket, [socket]));
      return worker;
    })()).pipe(map(() => this)).subscribe(StateHandler.loader);
  }

  /**
   * Public **deploy** method which defers the **deploy**ment of the supplied
   * `store` under the supplied `handle` to the {@link StateWorker}. For
   * convenience, instead of invoking this **deploy** method manually, the
   * {@link Stateful} decorator should be considered.
   *
   * @param handle - The {@link Bus.Handle} representing the {@link Store}.
   * @param store - The {@link Store} to **deploy** under the supplied `handle`.
   * @param state - An initial {@link Store.State} for the {@link Store}.
   * @param transient - Wether the {@link Store} is considered `transient`.
   * @typeParam T - The extending {@link Store} {@link InstanceType}.
   * @returns An {@link Observable} of the {@link Store} **deploy**ment.
   */
  public deploy<T extends Store>(
    handle: Bus.Handle,
    store: Store.Type<T>,
    state: Store.State<T>,
    transient: boolean = false
  ): Observable<void> {
    return from(this.worker).pipe(switchMap((worker) => {
      return worker.deploy(handle, store, state, transient);
    }));
  }

  /**
   * Public **deprecate** method which defers to an invocation of the backing
   * **deprecate** method of the {@link StateWorker} to **deprecate** the
   * {@link Store} represented by the supplied `handle`.
   *
   * @param handle - The {@link Bus.Handle} representing the {@link Store}.
   * @returns An {@link Observable} of the {@link Store} deprecation.
   */
  public deprecate(handle: Bus.Handle): Observable<void> {
    return from(this.worker).pipe(switchMap((worker) => {
      return worker.deprecate(handle);
    }));
  }

  /**
   * Public **dispatch** method which defers the **dispatch**ing of the supplied
   * `action` to the {@link Store} represented by the the supplied `handle` to
   * the {@link StateWorker}. For convenience, instead of manually invoking this
   * **dispatch** method manually, the {@link Stateful} decorator should be
   * considered.
   *
   * @param handle - The {@link Bus.Handle} representing the {@link Store}.
   * @param action - A type-guarded {@link Store.Action} to **dispatch**.
   * @typeParam T - The extending {@link Store} {@link InstanceType}.
   * @returns An {@link Observable} of the resulting {@link Store.State}.
   */
  public dispatch<T extends Store>(
    handle: Bus.Handle,
    ...action: Store.Action<T>
  ): Observable<Store.State<T>> {
    return from(this.worker).pipe(switchMap((worker) => {
      return worker.dispatch(handle, action as Store.Action<Store>);
    })) as Observable<Store.State<T>>;
  }

  /**
   * Public **implant** method which defers the **implant**ation of the supplied
   * `effect` under the supplied `locate` to the {@link StateWorker}. For
   * convenience, instead of invoking this **implant** method manually, the
   * {@link Implant} decorator should be considered.
   *
   * @param locate - The `locate` to address the {@link Effect} by.
   * @param effect - The {@link Effect} to **implant** under the `locate`.
   * @typeParam K - The {@link Store.Effect} `locate` type.
   * @returns An {@link Observable} of the {@link Store} **implant**ation.
   */
  public implant<K extends Store.Effect>(
    locate: K,
    effect: new () => Effect<K>
  ): Observable<void> {
    return from(this.worker).pipe(switchMap((worker) => {
      return worker.implant(locate, effect);
    }));
  }

  /**
   * Public **invalidate** method which defers to an invocation of the backing
   * **invalidate** method of the {@link StateWorker} to **invalidate** the
   * {@link Effect} represented by the supplied `locate`.
   *
   * @param locate - The `locate` to address the {@link Effect} by.
   * @typeParam K - The {@link Store.Effect} `locate` type.
   * @returns An {@link Observable} of the {@link Effect} invalidation.
   */
  public invalidate<K extends Store.Effect>(locate: K): Observable<void> {
    return from(this.worker).pipe(switchMap((worker) => {
      return worker.invalidate(locate);
    }));
  }

}

export type { StateWorker };
