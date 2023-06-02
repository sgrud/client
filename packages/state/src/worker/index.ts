import { Bus } from '@sgrud/bus/src/bus/bus';
import '@sgrud/bus/src/bus/transfer';
import { BusWorker } from '@sgrud/bus/src/handler/handler';
import '@sgrud/core/src/thread/transfer';
import { Singleton } from '@sgrud/core/src/utility/singleton';
import { TypeOf } from '@sgrud/core/src/utility/type-of';
import { IndexedDB } from '@sgrud/state/src/driver/indexeddb';
import { SQLite3 } from '@sgrud/state/src/driver/sqlite3';
import { Effect } from '@sgrud/state/src/effect/effect';
import '@sgrud/state/src/effect/transfer';
import { Store } from '@sgrud/state/src/store/store';
import '@sgrud/state/src/store/transfer';
import { expose, Remote, wrap } from 'comlink';
import { asyncScheduler, BehaviorSubject, defer, scheduled, switchMap } from 'rxjs';
import { name, version } from './package.json';

/**
 * The **self** reference to the global {@link ServiceWorkerGlobalScope}.
 */
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

/**
 * The **StateWorker** is a background {@link Thread} which is instantiated by
 * the {@link StateHandler} to handle the {@link deploy}ment of {@link Store}s
 * and {@link dispatch}ing {@link Store.Action}s against them. The same goes for
 * {@link Effect}s, whose {@link implant}ation the {@link StateWorker} handles.
 *
 * @decorator {@link Singleton}
 *
 * @see {@link StateHandler}
 */
@Singleton((stateWorker, [source]) => {
  return source ? stateWorker.proxy(source) : stateWorker;
})
export class StateWorker {

  /**
   * Static initialization block.
   */
  static {
    globalThis.sgrud = globalThis.sgrud || {};
    globalThis.sgrud.state = globalThis.sgrud.state || {};

    if (TypeOf.function(globalThis.importScripts)) {
      self.addEventListener('activate', (event) => this.activate(event));
      self.addEventListener('install', (event) => this.install(event));
      self.addEventListener('message', (event) => this.message(event));
    } else if (TypeOf.process(globalThis.process)) {
      const { isMainThread, parentPort } = require('worker_threads');

      if (!isMainThread) {
        globalThis.self = globalThis as Window & typeof globalThis;
        const nodeEndpoint = require('comlink/dist/umd/node-adapter');
        expose(new this(parentPort), nodeEndpoint(parentPort));
      } else {
        throw new TypeError(name);
      }
    } else {
      throw new TypeError(name);
    }
  }

  /**
   * Private static **activate** method, called when this {@link StateWorker} is
   * instantiated as {@link ServiceWorker} in a browser environment upon
   * activation of the {@link ServiceWorker}.
   *
   * @param event - The fired {@link ExtendableEvent}.
   */
  private static activate(event: ExtendableEvent): void {
    event.waitUntil(self.clients.claim());
  }

  /**
   * Private static **install** method, called when this {@link StateWorker} is
   * instantiated as {@link ServiceWorker} in a browser environment upon
   * installation of the {@link ServiceWorker}.
   *
   * @param event - The fired {@link ExtendableEvent}.
   */
  private static install(event: ExtendableEvent): void {
    event.waitUntil(self.skipWaiting());
  }

  /**
   * Private static **message** method, called when this {@link StateWorker} is
   * instantiated as {@link ServiceWorker} in a browser environment upon the
   * reception of messages from the controlling {@link Window}.
   *
   * @param event - The fired {@link ExtendableMessageEvent}.
   */
  private static message(event: ExtendableMessageEvent): void {
    if (event.data[name] instanceof MessagePort) {
      expose(new StateWorker(event.source), event.data[name]);
    } else if (event.data.ping && event.source) {
      event.source.postMessage({ pong: event.data.ping });
    }
  }

  /**
   * Internal {@link Store.Driver} employed as backing data storage. This
   * property contains an instance of either the {@link IndexedDB} or the
   * {@link SQLite3} class as abstract facade to either storage provider.
   */
  protected readonly driver: Store.Driver;

  /**
   * Internal {@link Map}ping of {@link Store.Effect} locates to their
   * corresponding bound {@link Effect}s.
   */
  protected readonly effects: Map<Store.Effect, Function>;

  /**
   * Internal {@link WeakMap}ping of {@link proxy}fied references to this
   * {@link StateWorker} to the {@link Store.Effects} namespace containing
   * {@link Effect}s bound to this {@link StateWorker}.
   */
  protected readonly proxies: WeakMap<object, Store.Effects>;

  /**
   * Internal {@link Map}ping of {@link Remote} {@link BusWorker}s to their
   * corresponding {@link proxy} of this {@link StateWorker}. This {@link Map}
   * is used to keep track of the {@link connect}ed {@link Window}s and their
   * respective {@link BusWorker}s.
   */
  protected readonly remotes: Map<this, Remote<BusWorker>>;

  /**
   * Internal {@link Map}ping of {@link Bus.Handle}s to {@link WeakMap}ping of
   * {@link Store.States} designated by an object reference. This reference
   * either points to the global {@link self} reference, if a {@link Store} is
   * {@link deploy}ed to be non-transient or, if the opposite applies, to the
   * {@link proxy}fied instance of this {@link StateWorker}. Through this
   * distinction stores are associated to either a globally shared reference or
   * to a locally contained and transparent {@link Proxy} reference to `this`.
   */
  protected readonly states: Map<Bus.Handle, WeakMap<object, Store.States>>;

  /**
   * Internal {@link Map}ping of {@link deploy}ed {@link Store.Type}s to their
   * corresponding {@link Bus.Handle}s.
   */
  protected readonly stores: Map<Bus.Handle, Store.Type<Store>>;

  /**
   * Public {@link Singleton} {@link StateWorker} **constructor**. As this is a
   * {@link Singleton} **constructor** it is only invoked the first time this
   * {@link StateWorker} class is targeted by the `new` operator. Furthermore
   * this **constructor** returns, depending of the presence of the `source`
   * parameter, a {@link proxy}fied instance of this {@link StateWorker} class
   * instead of the actual `this` reference.
   *
   * @param source - The initial {@link ExtendableMessageEvent} `source`.
   *
   * @remarks This method should only be invoked by the {@link StateHandler}.
   */
  public constructor(source: ExtendableMessageEvent['source']) {
    this.driver = TypeOf.function(globalThis.importScripts)
      ? new IndexedDB(name, version)
      : new SQLite3(name, version);

    this.effects = new Map<Store.Effect, Function>();
    this.proxies = new WeakMap<object, Store.Effects>();
    this.remotes = new Map<this, Remote<BusWorker>>();
    this.states = new Map<Bus.Handle, WeakMap<object, Store.States>>();
    this.stores = new Map<Bus.Handle, Store.Type<Store>>();

    return source ? this.proxy(source) : this;
  }

  /**
   * Public **connect** method which **connect**s this {@link StateWorker} to a
   * {@link BusWorker} through the supplied `socket`.
   *
   * @param socket - A {@link MessagePort} to the {@link BusWorker}.
   * @returns A {@link Promise} resolving upon `socket` **connect**ion.
   *
   * @remarks This method should only be invoked by the {@link StateHandler}.
   */
  public async connect(socket: MessagePort): Promise<void> {
    this.remotes.set(this, wrap<BusWorker>(socket));
  }

  /**
   * Public **deploy** method which **deploy**s the supplied `store` under the
   * supplied `handle`. If the {@link Store} is **deploy**ed `transient`ly, the
   * supplied `state` is used as initial {@link Store.State}. Otherwise, if a
   * previously persisted {@link Store.State} exists, it takes precedence over
   * the supplied `state`. Furthermore, when the supplied {@link Store.Type} is
   * already **deploy**ed and matches the currently **deploy**ed source code, no
   * action is taken. If the `store`'s sources mismatch, a {@link TypeError} is
   * thrown.
   *
   * @param handle - The {@link Bus.Handle} representing the {@link Store}.
   * @param store - The {@link Store} to **deploy** under the supplied `handle`.
   * @param state - An initial {@link Store.State} for the {@link Store}.
   * @param transient - Wether the {@link Store} is considered `transient`.
   * @typeParam T - The extending {@link Store} {@link InstanceType}.
   * @returns A {@link Promise} resolving upon {@link Store} **deploy**ment.
   * @throws A {@link TypeError} when the supplied `store` mismatches.
   *
   * @remarks This method should only be invoked by the {@link StateHandler}.
   */
  public async deploy<T extends Store>(
    handle: Bus.Handle,
    store: Store.Type<T>,
    state: Store.State<T>,
    transient: boolean = false
  ): Promise<void> {
    const deployed = this.stores.get(handle);
    let remote = this.remotes.get(this);
    let states = this.states.get(handle);
    let value = states?.get(self);

    if (!deployed) {
      this.stores.set(handle, store);
    } else {
      const keys = new Set([
        ...Object.getOwnPropertyNames(deployed.prototype),
        ...Object.getOwnPropertyNames(store.prototype)
      ]);

      for (const key of keys as Iterable<keyof Store<T>>) {
        const deployedAction = deployed.prototype[key]?.toString();
        const storeAction = store.prototype[key]?.toString();

        if (deployedAction !== storeAction) {
          throw new TypeError(handle);
        }
      }
    }

    if (!states) {
      states = new WeakMap<object, Store.States>();
      this.states.set(handle, states);
    }

    if (!value) {
      if (!transient) {
        state = await this.driver.getItem(handle).then((result) => {
          return result ? JSON.parse(result) : state;
        });

        value = scheduled(defer(() => value!), asyncScheduler).pipe(
          switchMap((next) => this.driver.setItem(handle, JSON.stringify(next)))
        ) as BehaviorSubject<any>;
      }

      value?.subscribe();
      value = new BehaviorSubject<Store.State<Store>>(state);
      states.set(transient ? this : self, value);
    }

    if (deployed || transient) {
      await remote?.publish(handle, value).catch(() => {
        this.remotes.delete(this);
      });
    } else {
      for (remote of this.remotes.values()) {
        await remote.publish(handle, value).catch(() => {
          this.remotes.delete(this);
        });
      }
    }
  }

  /**
   * Public **deprecate** method. When the returned {@link Promise} resolves,
   * the {@link deploy}ed {@link Store} referenced by the supplied `handle` is
   * guaranteed to be **deprecate**d. Otherwise a {@link ReferenceError} is
   * thrown (and therefore the returned {@link Promise} rejected).
   *
   * @param handle - The {@link Bus.Handle} representing the {@link Store}.
   * @returns A {@link Promise} resolving upon {@link Store} deprecation.
   * @throws A {@link ReferenceError} when no {@link Store} could be `handle`d.
   *
   * @remarks This method should only be invoked by the {@link StateHandler}.
   */
  public async deprecate(handle: Bus.Handle): Promise<void> {
    const states = this.states.get(handle);
    let state;

    if (state = states?.get(this)) {
      state.complete();
    } else if (state = states?.get(self)) {
      await this.driver.removeItem(handle);
      state.complete();
    } else {
      throw new ReferenceError(handle);
    }
  }

  /**
   * Public **dispatch** method. Invoking this method while supplying a `handle`
   * and a appropriate `action` will apply the supplied {@link Store.Action}
   * against the {@link Store} {@link deploy}ed under the supplied `handle`. The
   * returned {@link Promise} resolves to the resulting new {@link Store.State}
   * of the {@link Store} after the supplied {@link Store.Action} was
   * **dispatch**ed against it.
   *
   * @param handle - The {@link Bus.Handle} representing the {@link Store}.
   * @param action - A type-guarded {@link Store.Action} to **dispatch**.
   * @typeParam T - The extending {@link Store} {@link InstanceType}.
   * @returns A {@link Promise} resolving to the resulting {@link Store.State}.
   * @throws A {@link ReferenceError} when no {@link Store} could be `handle`d.
   *
   * @remarks This method should only be invoked by the {@link StateHandler}.
   */
  public async dispatch<T extends Store>(
    handle: Bus.Handle,
    action: Store.Action<T>
  ): Promise<Store.State<T>> {
    const store = this.stores.get(handle)?.prototype;
    const state = this.states.get(handle)?.has(this)
      ? this.states.get(handle)?.get(this)
      : this.states.get(handle)?.get(self);

    if (!state || !store) {
      throw new ReferenceError(handle);
    }

    const method = store[action[0] as keyof Store] as Function;
    const result = await method.call(state.value, ...action[1] || []);

    state.next(result);
    return result;
  }

  /**
   * Public **implant** method which **implant**s the supplied `effect` under
   * the supplied `locate` to the global {@link sgrud.state.effects} namespace.
   * When the supplied {@link Effect} is already **implant**ed and matches the
   * currently **implant**ed source code, no action is taken. If the `effect`'s
   * sources mismatch, a {@link TypeError} is thrown.
   *
   * @param locate - The `locate` to address the {@link Effect} by.
   * @param effect - The {@link Effect} to **implant** under the `locate`.
   * @typeParam K - The {@link Store.Effect} `locate` type.
   * @returns A {@link Promise} resolving upon {@link Store} **implant**ation.
   * @throws A {@link TypeError} when the supplied `effect` mismatches.
   *
   * @remarks This method should only be invoked by the {@link StateHandler}.
   */
  public async implant<K extends Store.Effect>(
    locate: K,
    effect: new () => Effect<K>
  ): Promise<void> {
    const implanted = this.effects.get(locate)?.toString();

    if (!implanted) {
      this.effects.set(locate, effect.prototype.function);
    } else if (implanted !== effect.prototype.function.toString()) {
      throw new TypeError(locate);
    }
  }

  /**
   * Public **invalidate** method. When the returned {@link Promise} resolves,
   * the {@link implant}ed {@link Effect} referenced by the supplied `locale` is
   * guaranteed to be **invalidate**d. Otherwise a {@link ReferenceError} is
   * thrown (and therefore the returned {@link Promise} rejected).
   *
   * @param locate - The `locate` to address the {@link Effect} by.
   * @typeParam K - The {@link Store.Effect} `locate` type.
   * @returns A {@link Promise} resolving upon {@link Effect} invalidation.
   * @throws A {@link ReferenceError} when no {@link Effect} could be `locate`d.
   *
   * @remarks This method should only be invoked by the {@link StateHandler}.
   */
  public async invalidate<K extends Store.Effect>(locate: K): Promise<void> {
    if (!this.effects.delete(locate)) {
      throw new ReferenceError(locate);
    }
  }

  /**
   * Private **proxy** method wrapping this {@link StateWorker} instance in a
   * {@link Proxy}. The resulting {@link Proxy} is used to provide distinct
   * `this` references for each of the {@link connect}ed {@link remotes} and
   * intercepts {@link dispatch} invocations to provide the globally available
   * {@link sgrud.state.effects} namespace.
   *
   * @param source - The initial {@link ExtendableMessageEvent} `source`.
   * @returns A {@link Proxy} wrapping the {@link StateWorker}.
   */
  private proxy(source: Client | ServiceWorker | MessagePort): this {
    const stateWorker = new Proxy(this, {
      get: (...args) => {
        if (args[1] === 'dispatch') {
          let proxy = this.proxies.get(source);

          if (!proxy) {
            this.proxies.set(source, proxy = new Proxy({} as Store.Effects, {
              get: (_, propertyKey: Store.Effect) => {
                const effect = this.effects.get(propertyKey);
                if (effect) return effect.call(stateWorker);
                throw new ReferenceError(propertyKey);
              }
            }));
          }

          self.sgrud.state.effects = proxy;
        }

        return Reflect.get(...args);
      }
    });

    return stateWorker;
  }

}
