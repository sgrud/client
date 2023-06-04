import { Factor, Linker, Mutable, Provider, Singleton, TypeOf } from '@sgrud/core';
import { NEVER, Observable, catchError, defer, fromEvent, map, merge, race, switchMap, tap, throwError } from 'rxjs';
import { Component, component } from '../component/component';
import { customElements } from '../component/registry';
import { Router } from '../router/router';
import { Queue } from './queue';

/**
 * The **Catch** type alias is used and intended to be used in conjunction with
 * the {@link CatchQueue} and represents a function that is called with the
 * thrown `error`. The return value of this callback will be used to examine
 * whether the {@link Component} containing the decorated property is
 * responsible to handle the thrown `error`.
 *
 * @see {@link CatchQueue}
 */
export type Catch = ((

  /**
   * The thrown **error**.
   */
  error: unknown

) => boolean) | undefined;

/**
 * {@link Component} prototype property decorator factory. Applying the
 * **Catch** decorator to a property, while optionally supplying a **trap** will
 * navigate to the {@link Component} containing the decorated property when an
 * error, **trap**ed by this **Catch** decorator, occurs during navigation.
 *
 * @param trap - The {@link Catch} callback deciding whether to `trap` an error.
 * @returns A {@link Component} prototype property decorator.
 *
 * @example
 * **Catch** all {@link URIError}s:
 * ```tsx
 * import { Component, Catch } from '@sgrud/shell';
 *
 * declare global {
 *   interface HTMLElementTagNameMap {
 *     'example-component': ExampleComponent;
 *   }
 * }
 *
 * ⁠@Component('example-component')
 * export class ExampleComponent extends HTMLElement implements Component {
 *
 *   ⁠@Catch((error) => error instanceof URIError)
 *   public readonly error?: URIError;
 *
 *   public get template(): JSX.Element {
 *     return <span>Error message: {this.error?.message}</span>;
 *   }
 *
 * }
 * ```
 *
 * @see {@link CatchQueue}
 */
export function Catch(trap?: Catch) {

  /**
   * @param prototype - The {@link Component} `prototype` to be decorated.
   * @param propertyKey - The {@link Component} property to be decorated.
   */
  return function(prototype: Component, propertyKey: PropertyKey): void {
    const linker = new Linker();
    const queued = new CatchQueue();
    let traps = queued.traps.get(prototype.constructor);

    if (!linker.has(CatchQueue)) {
      linker.set(CatchQueue, queued);
    }

    if (!traps) {
      traps = new Map<PropertyKey, Catch>();
      queued.traps.set(prototype.constructor, traps);
    }

    traps.set(propertyKey, trap);

    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get(this: Component) {
        return queued.trapped.get(prototype.constructor)?.[propertyKey];
      },
      set(this: Component, value: unknown): void {
        if (this.isConnected) {
          let trapped = queued.trapped.get(prototype.constructor);

          if (!trapped) {
            queued.trapped.set(prototype.constructor, trapped = {});
          }

          trapped[propertyKey] = value;
        }
      }
    });
  };

}

/**
 * This built-in **CatchQueue** extension of the {@link Queue} base class is
 * used by the {@link Catch} decorator to intercept {@link Router} navigation
 * events and handles all errors thrown during the asynchronous evaluation of
 * {@link Router.navigate} invocations. When the {@link Catch} decorator is
 * applied at least once this **CatchQueue** will be automatically provided as
 * {@link Queue} to the {@link Linker}-
 *
 * @decorator {@link Singleton}
 *
 * @see {@link Queue}
 */
@Singleton()
export class CatchQueue
  extends Provider<typeof Queue>('sgrud.shell.Queue') {

  /**
   * {@link Map}ping of all decorated {@link Component}s to a {@link Map} of
   * property keys and **trapped** errors.
   */
  public readonly trapped: Map<Function, Record<PropertyKey, unknown>>;

  /**
   * {@link Map}ping of all decorated {@link Component}s to a {@link Map} of
   * property keys and their **traps**.
   */
  public readonly traps: Map<Function, Map<PropertyKey, Catch>>;

  /**
   * {@link Factor}ed-in **router** property linking the {@link Router}.
   *
   * @decorator {@link Factor}
   */
  @Factor(() => Router)
  private readonly router!: Router;

  /**
   * Public {@link Singleton}  **constructor**. Called by the {@link Catch}
   * decorator to link this {@link Queue} into the {@link Router} and to access
   * the {@link trapped} and {@link traps} properties.
   */
  public constructor() {
    super();

    this.trapped = new Map<Function, Record<PropertyKey, unknown>>();
    this.traps = new Map<Function, Map<PropertyKey, Catch>>();
  }

  /**
   * Overridden **handle** method of the {@link Queue} base class. Iterates all
   * {@link Router.Segment}s of the `next` {@link Router.State} and collects all
   * {@link traps} for any encountered {@link Component}s in those iterated
   * {@link Router.Segment}s.
   *
   * @param _prev - The `_prev`iously active {@link Router.State} (ignored).
   * @param next - The `next` {@link Router.State} {@link Router.navigate}d to.
   * @param queue - The next {@link Queue} to **handle** the navigation.
   * @returns An {@link Observable} of the **handle**d {@link Router.State}.
   */
  public override handle(
    _prev: Router.State,
    next: Router.State,
    queue: Router.Queue
  ): Observable<Router.State> {
    return race(
      this.handleErrors(),
      queue.handle(next)
    ).pipe(catchError((error) => {
      let segment = this.router.spool(next.segment, false);
      let trapped;

      loop: do {
        delete (segment as Mutable<Router.Segment>).child;
        const elements = [];

        if (segment.route.component) {
          elements.push(segment.route.component);
        }

        if (segment.route.slots) {
          for (const key in segment.route.slots) {
            elements.push(segment.route.slots[key]);
          }
        }

        for (const element of elements) {
          let constructor = customElements.get(element) as (
            CustomElementConstructor & { [component]?: new () => Component }
          ) | undefined;

          if (constructor) {
            constructor = constructor[component] || constructor;
            const route = this.router.join(segment);
            const traps = this.traps.get(constructor);

            if (TypeOf.string(route) && traps?.size) {
              for (const [key, trap] of traps) {
                const handle = trap?.(error);

                if (handle || !trap) {
                  trapped = defer(() => {
                    this.trapped.clear();
                    this.trapped.set(constructor!, { [key]: error });
                    return this.router.navigate(route, '', 'replace');
                  });

                  if (handle) {
                    break loop;
                  }
                }
              }
            }
          }
        }
      } while (segment = segment.parent!);

      if (!trapped) {
        loop: for (const [constructor, traps] of this.traps) {
          const element = constructor.prototype[component] || constructor;
          const selector = customElements.getName(element);
          const route = selector && this.router.lookup(selector);

          if (TypeOf.string(route) && traps.size) {
            for (const [key, trap] of traps) {
              const handle = trap?.(error);

              if (handle || !trap) {
                trapped = defer(() => {
                  this.trapped.clear();
                  this.trapped.set(constructor, { [key]: error });
                  return this.router.navigate(route, '', 'replace');
                });

                if (handle) {
                  break loop;
                }
              }
            }
          }
        }
      }

      return trapped || throwError(() => error);
    }));
  }

  /**
   * **handleErrors** helper method returning an {@link Observable} from the
   * global `window.onerror` and `window.unhandledrejection` event emitters. The
   * returned {@link Observable} will either {@link NEVER} complete or invoke
   * {@link throwError} with any globally emitted {@link ErrorEvent} or the
   * reason for a {@link PromiseRejectionEvent} while subscribed to.
   *
   * @returns An {@link Observable} that {@link NEVER} completes.
   * @throws An {@link Observable} of any globally emitted error or rejection.
   */
  private handleErrors(): Observable<never> {
    if (TypeOf.window(globalThis.window)) {
      return merge(
        fromEvent<ErrorEvent>(window, 'error').pipe(
          tap((event) => event.preventDefault()),
          map((event) => event.error)
        ),
        fromEvent<PromiseRejectionEvent>(window, 'unhandledrejection').pipe(
          tap((event) => event.preventDefault()),
          map((event) => event.reason)
        )
      ).pipe(
        switchMap((error) => throwError(() => error))
      );
    }

    return NEVER;
  }

}
