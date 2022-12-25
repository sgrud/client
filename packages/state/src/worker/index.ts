import { BusHandle, BusWorker } from '@sgrud/bus';
import { Singleton } from '@sgrud/core';
import { expose, Remote, wrap } from 'comlink';
import { BehaviorSubject, defer, tap } from 'rxjs';
import '../handler/transfer';
import { Store } from '../store/store';
import { name, version } from './package.json';

/**
 *
 */
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

/**
 *
 */
export interface StateWorker {

  /**
   * @param port -
   * @returns .
   */
  connect(port: MessagePort): Promise<void>;

  /**
   * @param handle -
   * @param store -
   * @param state -
   * @param transient -
   * @returns .
   */
  deploy(
    handle: BusHandle,
    store: Store.Type<any>,
    state: Store.State<any>,
    transient?: boolean
  ): Promise<void>;

  /**
   * @param handle -
   * @param action -
   * @returns .
   */
  dispatch(
    handle: BusHandle,
    action: Store.Action<any>
  ): Promise<Store.State<any>>;

}

/**
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @decorator [Singleton][]
 */
@Singleton<typeof StateWorker>((stateWorker, [source]) => {
  return source ? stateWorker.proxy(source) : stateWorker;
})
export class StateWorker {

  /**
   *
   */
  static {
    self.addEventListener('activate', (event) => this.activate(event));
    self.addEventListener('install', (event) => this.install(event));
    self.addEventListener('message', (event) => this.message(event));
  }

  /**
   * @param event -
   */
  private static activate(event: ExtendableEvent): void {
    event.waitUntil(self.clients.claim());
  }

  /**
   * @param event -
   */
  private static install(event: ExtendableEvent): void {
    event.waitUntil(self.skipWaiting());
  }

  /**
   * @param event -
   */
  private static message(event: ExtendableMessageEvent): void {
    if (event.data[name] instanceof MessagePort) {
      expose(new StateWorker(event.source), event.data[name]);
      event.preventDefault();
    }
  }

  /**
   *
   */
  private readonly database: Promise<IDBDatabase>;

  /**
   *
   */
  private readonly remotes: Map<object, Remote<BusWorker>>;

  /**
   *
   */
  private readonly states: Map<BusHandle, Map<object, BehaviorSubject<any>>>;

  /**
   *
   */
  private readonly stores: Map<BusHandle, Store.Type<any>>;

  /**
   * @param source -
   */
  public constructor(source?: ExtendableMessageEvent['source']) {
    this.database = new Promise((resolve, reject) => {
      const request = indexedDB.open(version);

      request.onerror = reject;
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => request.result
        .createObjectStore(name, { keyPath: 'handle' })
        .createIndex('handle', 'handle', { unique: true });
    });

    this.remotes = new Map<object, Remote<BusWorker>>();
    this.states = new Map<BusHandle, Map<object, BehaviorSubject<any>>>();
    this.stores = new Map<BusHandle, Store.Type<any>>();

    return source ? this.proxy(source) : this;
  }

  /**
   * @param source -
   * @param port -
   */
  private async _connect(source: object, port: MessagePort): Promise<void> {
    this.remotes.set(source, wrap<BusWorker>(port));
  }

  /**
   * @param source -
   * @param handle -
   * @param store -
   * @param state -
   * @param transient -
   * @throws ReferenceError.
   */
  private async _deploy(
    source: object,
    handle: BusHandle,
    store: Store.Type<any>,
    state: Store.State<any>,
    transient: boolean = false
  ): Promise<void> {
    const deployed = this.stores.get(handle);
    let remote = this.remotes.get(source);
    let states = this.states.get(handle);
    let value = states?.get(this);

    if (!deployed) {
      this.stores.set(handle, store);
    } else {
      const keys = new Set([
        ...Object.getOwnPropertyNames(deployed.prototype),
        ...Object.getOwnPropertyNames(store.prototype)
      ]);

      for (const key of keys as Iterable<keyof Store>) {
        const deployedAction = deployed.prototype[key]?.toString();
        const storeAction = store.prototype[key]?.toString();

        if (deployedAction !== storeAction) {
          throw new ReferenceError(handle);
        }
      }
    }

    if (!states) {
      states = new Map<object, BehaviorSubject<any>>();
      this.states.set(handle, states);
    }

    if (!value) {
      if (!transient && (source = this)) {
        const database = await this.database;

        state = await new Promise((resolve) => {
          const session = database.transaction(name);
          const request = session.objectStore(name).get(handle);

          request.onerror = () => resolve(state);
          request.onsuccess = () => resolve(request.result || state);
        });

        value = defer(() => value!).pipe(tap((next) => {
          const session = database.transaction(name, 'readwrite');
          session.objectStore(name).put({ handle, value: next });
        })) as any;
      }

      value?.subscribe();
      value = new BehaviorSubject<any>(state);
      states.set(source, value);
    }

    if (deployed || transient) {
      await remote?.set(handle, value.asObservable());
    } else {
      for (remote of this.remotes.values()) {
        await remote.set(handle, value.asObservable());
      }
    }
  }

  /**
   * @param source -
   * @param handle -
   * @param action -
   * @returns .
   * @throws ReferenceError.
   */
  private async _dispatch(
    source: object,
    handle: BusHandle,
    action: Store.Action<any>
  ): Promise<Store.State<any>> {
    const store = this.stores.get(handle);
    const state = this.states.get(handle)?.has(source)
      ? this.states.get(handle)?.get(source)
      : this.states.get(handle)?.get(this);

    if (!state || !store) {
      throw new ReferenceError(handle);
    }

    const method = store.prototype[action[0] as keyof Store] as Function;
    const result = await method.call(state.value, ...action[1] as unknown[]);

    state.next(result);
    return result;
  }

  /**
   * @param source -
   * @returns .
   */
  private proxy(source: object): this {
    return new Proxy(this, {
      get: (target, propertyKey, receiver) => {
        switch (propertyKey) {
          case 'connect': return this._connect.bind(this, source);
          case 'deploy': return this._deploy.bind(this, source);
          case 'dispatch': return this._dispatch.bind(this, source);
          default: return Reflect.get(target, propertyKey, receiver);
        }
      }
    });
  }

}
