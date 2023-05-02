/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import { Kernel, Singleton, Symbol, Thread, TypeOf } from '@sgrud/core';
import { Endpoint, wrap } from 'comlink';
import { NodeEndpoint } from 'comlink/dist/umd/node-adapter';
import { Observable, ObservableInput, ReplaySubject, Subscribable, Subscription, connectable, firstValueFrom, from, map, switchMap } from 'rxjs';
import { Bus } from '../bus/bus';
import { BusWorker } from '../worker';
import { name } from '../worker/package.json';

/**
 * The **BusHandler** implements and orchestrates the establishment, transferral
 * and deconstruction of any number of {@link Observable} streams. It operates
 * in conjunction with the {@link BusWorker} {@link Thread} which is run in the
 * background. To designate and organize different {@link Observable} streams,
 * the string literal helper type {@link Bus.Handle} is employed. As an example,
 * let the following hierarchical structure be given:
 *
 * ```text
 * io.github.sgrud
 * ├── io.github.sgrud.core
 * │   ├── io.github.sgrud.core.kernel
 * │   └── io.github.sgrud.core.transit
 * ├── io.github.sgrud.data
 * │   ├── io.github.sgrud.data.model.current
 * │   └── io.github.sgrud.data.model.global
 * └── io.github.sgrud.shell
 * │   └── io.github.sgrud.shell.route
 * └── io.github.sgrud.store
 *     ├── io.github.sgrud.store.global
 *     └── io.github.sgrud.store.local
 * ```
 *
 * Depending on the {@link Bus.Handle}, one may {@link observe} all established
 * streams beneath the root `io.github.sgrud` {@link Bus.Handle} or only one
 * specific stream, e.g., `io.github.sgrud.core.kernel`. The {@link Observable}
 * returned from the {@link observe} method will emit all {@link Bus.Value}s
 * originating from all streams beneath the root {@link Bus.Handle} in the first
 * case, or only {@link Bus.Value}s from one stream, in the second case.
 *
 * @decorator {@link Singleton}
 *
 * @see {@link BusWorker}
 */
@Singleton()
export class BusHandler {

  /**
   * Private static {@link ReplaySubject} used as the {@link BusHandler}
   * **loader**. This **loader** emits once after the {@link BusHandler} has
   * been successfully initialized.
   */
  private static loader: ReplaySubject<BusHandler>;

  /**
   * Static `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} mirrors the private {@link loader} and is
   * used for initializations after the {@link BusHandler} has been
   * successfully initialized.
   *
   * @returns A {@link Subscribable} emitting this {@link BusHandler}.
   *
   * @example
   * Subscribe to the {@link BusHandler}:
   * ```ts
   * import { BusHandler } from '@sgrud/bus';
   * import { from } from 'rxjs';
   *
   * from(BusHandler).subscribe(console.log);
   * ```
   */
  public static [Symbol.observable](): Subscribable<BusHandler> {
    return this.loader.asObservable();
  }

  /**
   * Static initialization block.
   */
  static {
    this.loader = new ReplaySubject<BusHandler>(1);
  }

  /**
   * The **worker** {@link Thread} and main background workhorse. The underlying
   * {@link BusWorker} is run inside a {@link Worker} context in the background
   * and transparently handles {@link publish}ed and {@link observe}d streams
   * and the aggregation of their values depending on their {@link Bus.Handle},
   * i.e., hierarchy.
   *
   * @see {@link BusWorker}
   */
  public readonly worker: Thread<BusWorker>;

  /**
   * Public {@link BusHandler} **constructor**. As the {@link BusHandler} is a
   * {@link Singleton} class, this **constructor** is only invoked the first
   * time it is targeted by the `new` operator. Upon this first invocation, the
   * {@link worker} property is assigned an instance of the {@link BusWorker}
   * {@link Thread} while using the supplied `source`, if any.
   *
   * @param source - An optional {@link Kernel.Module} `source`.
   * @throws A {@link ReferenceError} when the environment is incompatible.
   */
  public constructor(source?: string) {
    from(this.worker = (async() => {
      let worker: Endpoint | NodeEndpoint;

      if (TypeOf.process(globalThis.process)) {
        const { Worker } = require('worker_threads');
        worker = new Worker(require.resolve(name));

        const nodeEndpoint = require('comlink/dist/umd/node-adapter');
        worker = nodeEndpoint(worker);
      } else {
        const kernel = new Kernel();
        source ||= `${kernel.nodeModules}/${name}`;
        const module = await firstValueFrom(kernel.resolve(name, source));

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
    })()).pipe(map(() => this)).subscribe(BusHandler.loader);
  }

  /**
   * Invoking this method **observe**s the {@link Observable} stream represented
   * by the supplied `handle`. The method will return an {@link Observable}
   * originating from the {@link BusWorker} which emits all {@link Bus.Value}s
   * published under the supplied `handle`. When the **observe** method is
   * invoked with `'io.github.sgrud'`, all streams hierarchically beneath this
   * {@link Bus.Handle}, e.g., `'io.github.bus.status'`, will also be emitted by
   * the returned {@link Observable}.
   *
   * @param handle - The {@link Bus.Handle} to **observe**.
   * @typeParam T - The type of the **observe**d {@link Observable} stream.
   * @returns An {@link Observable} bus for `handle`.
   *
   * @example
   * **observe** the `'io.github.sgrud'` stream:
   * ```ts
   * import { BusHandler } from '@sgrud/bus';
   *
   * const busHandler = new BusHandler();
   * const handle = 'io.github.sgrud.example';
   *
   * busHandler.observe(handle).subscribe(console.log);
   * ```
   */
  public observe<T>(handle: Bus.Handle): Observable<Bus.Value<T>> {
    return from(this.worker).pipe(
      switchMap((worker) => worker.observe(handle)),
      switchMap((value) => value as Observable<Bus.Value<T>>)
    );
  }

  /**
   * Invoking this method **publish**es the supplied {@link Observable} `stream`
   * under the supplied `handle`. This method returns an {@link Observable} of
   * the **publish**ment of the supplied {@link Observable} `stream` under the
   * supplied `handle` with the {@link BusWorker}. When the **publish**ed
   * `source` {@link Observable} completes, the registration within the
   * {@link BusWorker} will automatically self-destruct.
   *
   * @param handle - The {@link Bus.Handle} to **publish** under.
   * @param stream - The {@link Observable} `stream` for `handle`.
   * @typeParam T - The type of the **publish**ed {@link Observable} stream.
   * @returns An {@link Observable} of the `stream` **publish**ment.
   *
   * @example
   * **publish** a stream under `'io.github.sgrud.example'`:
   * ```ts
   * import { BusHandler } from '@sgrud/bus';
   * import { of } from 'rxjs';
   *
   * const busHandler = new BusHandler();
   * const handle = 'io.github.sgrud.example';
   * const stream = of('published');
   *
   * busHandler.publish(handle, stream).subscribe();
   * ```
   */
  public publish<T>(
    handle: Bus.Handle,
    stream: ObservableInput<T>
  ): Observable<void> {
    (stream = connectable(stream, {
      connector: () => new ReplaySubject<T>(),
      resetOnDisconnect: false
    })).connect();

    return from(this.worker).pipe(
      switchMap((worker) => worker.publish(handle, stream))
    );
  }

  /**
   * Invoking this method **uplink**s the supplied `handle` to the supplied
   * `url` by establishing a {@link WebSocket} connection between the endpoint
   * behind the supplied `url` and the {@link BusWorker}. This method returns an
   * {@link Observable} of the **uplink** {@link Subscription} which can be used
   * to cancel the **uplink**. When the **uplink**ed {@link WebSocket} is closed
   * or throws an error, it is automatically cleaned up and unsubscribed from.
   *
   * @param handle - The {@link Bus.Handle} to **uplink**.
   * @param url - The endpoint `url` to establish an **uplink** to.
   * @returns An {@link Observable} of the **uplink** {@link Subscription}.
   *
   * @example
   * **uplink** the `'io.github.sgrud.uplink'` {@link Bus.Handle}:
   * ```ts
   * import { BusHandler } from '@sgrud/bus';
   *
   * const busHandler = new BusHandler();
   * const handle = 'io.github.sgrud.example';
   * const url = 'https://example.com/websocket';
   *
   * const uplink = busHandler.uplink(handle, url).subscribe();
   * ```
   */
  public uplink(handle: Bus.Handle, url: string): Observable<Subscription> {
    return from(this.worker).pipe(
      switchMap((worker) => worker.uplink(handle, url))
    );
  }

}

export type { BusWorker };
