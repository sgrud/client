import { Bus } from '@sgrud/bus/src/bus/bus';
import '@sgrud/bus/src/bus/transfer';
import { Thread } from '@sgrud/core/src/thread/thread';
import '@sgrud/core/src/thread/transfer';
import { assign } from '@sgrud/core/src/utility/assign';
import { Singleton } from '@sgrud/core/src/utility/singleton';
import { TypeOf } from '@sgrud/core/src/utility/type-of';
import { BehaviorSubject, connectable, distinctUntilChanged, filter, finalize, map, materialize, merge, Observable, ObservableInput, ReplaySubject, Subscription, switchMap } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';

/**
 * The **BusWorker** is a background {@link Thread} which is {@link Spawn}ed by
 * the {@link BusHandler} to handle all {@link publish}ed and {@link observe}d
 * {@link streams}, {@link uplinks} and their aggregation depending on their
 * hierarchy.
 *
 * @decorator {@link Thread}
 * @decorator {@link Singleton}
 *
 * @see {@link BusHandler}
 */
@Thread()
@Singleton()
export class BusWorker {

  /**
   * {@link BehaviorSubject} emitting every time when **changes** occur on the
   * internal {@link streams} or {@link uplinks} mappings. This emittance is
   * used to recombine the {@link Observable} streams which were previously
   * obtained to through use of the {@link observe} method.
   */
  private readonly changes: BehaviorSubject<this>;

  /**
   * Internal {@link Map}ping containing all established **streams**. Updating
   * this map should always be accompanied by an emittance of {@link changes}.
   */
  private readonly streams: Map<Bus.Handle, Observable<Bus.Value<unknown>>>;

  /**
   * Internal {@link Map}ping containing all established **uplinks**. Updating
   * this map should always be accompanied by an emittance of {@link changes}.
   */
  private readonly uplinks: Map<Bus.Handle, Observable<Bus.Value<unknown>>>;

  /**
   * Public **constructor**. This **constructor** is called once when the
   * {@link BusHandler} {@link Spawn}s this {@link BusWorker}.
   *
   * @remarks This method should only be invoked by the {@link BusHandler}.
   */
  public constructor() {
    this.changes = new BehaviorSubject<this>(this);
    this.streams = new Map<Bus.Handle, Observable<Bus.Value<unknown>>>();
    this.uplinks = new Map<Bus.Handle, Observable<Bus.Value<unknown>>>();
  }

  /**
   * Invoking this method **observe**s all {@link Observable} {@link streams}
   * under the supplied `handle` by {@link merge}ing all {@link streams} which
   * are {@link publish}ed under the supplied `handle`.
   *
   * @param handle - The {@link Bus.Handle} to **observe**.
   * @returns An {@link Observable} stream for `handle`.
   *
   * @remarks This method should only be invoked by the {@link BusHandler}.
   */
  public async observe<T>(
    handle: Bus.Handle
  ): Promise<Observable<Bus.Value<T>>> {
    return this.changes.pipe(
      map(() => {
        const streams = [];

        for (const [key, value] of this.streams) {
          if (key.startsWith(handle)) {
            streams.push(value as Observable<Bus.Value<T>>);
          }
        }

        for (const [key, value] of this.uplinks) {
          if (key.startsWith(handle)) {
            streams.push(value as Observable<Bus.Value<T>>);
          }
        }

        return streams;
      }),
      distinctUntilChanged((a, b) => {
        return a.every((i) => b.includes(i)) && b.every((i) => a.includes(i));
      }),
      switchMap((streams) => {
        return merge(...streams);
      })
    );
  }

  /**
   * Invoking this method **publish**es the supplied {@link ObservableInput}
   * `stream` under the supplied `handle`. Any emittance of the **publish**ed
   * `stream` will be {@link materialize}d into {@link Bus.Value}s and replayed
   * once to every {@link observe}r.
   *
   * @param handle - The {@link Bus.Handle} to **publish** under.
   * @param stream - The {@link ObservableInput} `stream` for `handle`.
   * @returns A {@link Promise} of the `stream` **publish**ment.
   * @throws A {@link ReferenceError} on collision of `handle`s.
   *
   * @remarks This method should only be invoked by the {@link BusHandler}.
   */
  public async publish<T>(
    handle: Bus.Handle,
    stream: ObservableInput<T>
  ): Promise<void> {
    if (this.streams.has(handle)) {
      throw new ReferenceError(handle);
    } else {
      (stream = connectable(stream, {
        connector: () => new ReplaySubject<T>(1),
        resetOnDisconnect: false
      })).connect().add(() => {
        this.streams.delete(handle);
        this.changes.next(this);
      });

      this.streams.set(handle, stream.pipe(materialize(), map((value) => {
        return assign(value, { handle });
      })));

      this.changes.next(this);
    }
  }

  /**
   * Invoking this method **uplink**s the supplied `handle` to the supplied
   * `url` by establishing a {@link WebSocket} connection between the endpoint
   * behind the supplied `url` and this {@link BusWorker}. It is assumed, that
   * all messages emanating from the {@link WebSocket} endpoint conform to the
   * {@link Bus.Value} type and are therefore treated as such. This treatment
   * includes the filtering of all received and submitted messages by comparing
   * their corresponding {@link Bus.Handle} and the supplied `handle`.
   *
   * @param handle - The {@link Bus.Handle} to **uplink**.
   * @param url - The endpoint `url` to establish an **uplink** to.
   * @returns A {@link Promise} of the {@link Subscription} to the **uplink**.
   * @throws A {@link ReferenceError} on collision of `handle`s.
   *
   * @remarks This method should only be invoked by the {@link BusHandler}.
   */
  public async uplink(handle: Bus.Handle, url: string): Promise<Subscription> {
    if (this.uplinks.has(handle)) {
      throw new ReferenceError(handle);
    } else {
      const buffer = new Set<unknown>();
      const socket = new WebSocketSubject<Bus.Value<unknown>>({
        url, WebSocketCtor: TypeOf.process(globalThis.process)
          ? require('ws').WebSocket as typeof WebSocket
          : WebSocket
      });

      const stream = await this.observe(handle);
      const uplink = socket.pipe(filter((value) => {
        if (value.handle.startsWith(handle)) {
          buffer.add(value);
          return true;
        }

        return false;
      }));

      this.uplinks.set(handle, uplink);
      this.changes.next(this);

      return stream.pipe(filter((value) => {
        return !buffer.delete(value);
      }), finalize(() => {
        this.uplinks.delete(handle);
        this.changes.next(this);
        socket.complete();
      })).subscribe(socket);
    }
  }

}
