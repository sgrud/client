import { BusHandle, BusHandler } from '@sgrud/bus';
import { assign, Factor, Kernel, Singleton, Symbol, Thread } from '@sgrud/core';
import { createEndpoint, transfer, wrap } from 'comlink';
import { firstValueFrom, from, fromEvent, map, Observable, of, switchMap, tap } from 'rxjs';
import { Store } from '../store/store';
import { StateWorker } from '../worker';
import { name } from '../worker/package.json';

/**
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @decorator [Singleton][]
 */
@Singleton<typeof StateHandler>()
export class StateHandler extends Map<BusHandle, Store> {

  /**
   *
   */
  public readonly worker: Thread<StateWorker>;

  /**
   * [Factor]: https://sgrud.github.io/client/functions/core.Factor
   *
   * @decorator [Factor][]
   */
  @Factor(() => BusHandler)
  private readonly busHandler!: BusHandler;

  /**
   * [Factor]: https://sgrud.github.io/client/functions/core.Factor
   *
   * @decorator [Factor][]
   */
  @Factor(() => Kernel)
  private readonly kernel!: Kernel;

  /**
   * @throws ReferenceError.
   */
  public constructor() {
    super();

    this.worker = (async() => {
      const source = `${this.kernel.nodeModules}/${name}`;
      const module = await firstValueFrom(this.kernel.resolve(name, source));

      if (!globalThis.sgrud && module.exports) {
        await navigator.serviceWorker.register(`${source}/${module.exports}`, {
          scope: this.kernel.baseHref,
          type: 'module'
        });
      } else if (globalThis.sgrud && module.unpkg) {
        await navigator.serviceWorker.register(`${source}/${module.unpkg}`, {
          scope: this.kernel.baseHref,
          type: 'classic'
        });
      } else {
        throw new ReferenceError(module.name);
      }

      const controller = navigator.serviceWorker.controller! || await (
        firstValueFrom(fromEvent(navigator.serviceWorker, 'controllerchange'))
      ).then(() => navigator.serviceWorker.controller);

      const { port1, port2 } = new MessageChannel();
      const remote = await this.busHandler.worker;
      const thread = await remote[createEndpoint]();
      const worker = wrap<StateWorker>(port1);

      controller.postMessage({ [name]: port2 }, [port2]);
      await worker.connect(transfer(thread, [thread]));
      return worker;
    })();
  }

  /**
   * @param handle -
   * @param store -
   * @param state -
   * @param transient -
   * @returns .
   */
  public deploy<T extends Store>(
    handle: BusHandle,
    store: Store.Type<T>,
    state: Store.State<T>,
    transient: boolean = false
  ): Observable<Store<T>> {
    let deployed = super.get(handle);

    if (!deployed) {
      deployed = assign(Object.create(store.prototype), {
        [Symbol.observable]: () => this.busHandler.get(handle).pipe(
          map(({ value }) => value)
        ),
        dispatch: (...action: Store.Action<any>) => from(this.worker).pipe(
          switchMap((worker) => worker.dispatch(handle, action))
        )
      });

      return from(this.worker).pipe(
        switchMap((worker) => worker.deploy(handle, store, state, transient)),
        tap(() => super.set(handle, deployed!)),
        map(() => deployed!)
      );
    }

    return of(deployed);
  }

}

export type { StateWorker };
