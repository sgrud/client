import { Factor, Mutable, Provider, Singleton, Target, TypeOf } from '@sgrud/core';
import { catchError, defer, finalize, fromEvent, map, merge, NEVER, Observable, race, switchMap, tap, throwError } from 'rxjs';
import { component, Component } from '../component/component';
import { customElements } from '../component/registry';
import { Router } from '../router/router';
import { RouterTask } from '../router/task';

/**
 * The **Catch** type alias is used and intended to be used in conjunction with
 * the [CatchTask][] [RouterTask][] and represents a function that is called
 * with the thrown `error`. The return value will be used to examine wether the
 * component containing the decorated property is responsible to handle the
 * thrown `error`.
 *
 * [CatchTask]: https://sgrud.github.io/client/classes/shell.CatchTask
 * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
 *
 * @see [CatchTask][]
 */
export type Catch = ((

  /**
   * The thrown **error**.
   */
  error: any

) => boolean) | undefined;

/**
 * [Component][] prototype property decorator factory. Applying the **Catch**
 * decorator to a property, while optionally supplying a **filter** will
 * navigate to the [Component][] containing the decorated property when an error
 * occurs during navigation.
 *
 * [CatchTask]: https://sgrud.github.io/client/classes/shell.CatchTask
 * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
 *
 * @param filter -
 * @returns [Component][] prototype property decorator.
 *
 * @see [CatchTask][]
 */
export function Catch(filter?: Catch) {

  /**
   * @param prototype - [Component][] prototype to be decorated.
   * @param propertyKey - [Component][] property to be decorated.
   *
   * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
   */
  return function(
    prototype: Component,
    propertyKey: PropertyKey
  ): void {
    const tasks = new CatchTask();
    let traps = tasks.traps.get(prototype.constructor);

    if (!traps) {
      traps = new Map<PropertyKey, Catch>();
      tasks.traps.set(prototype.constructor, traps);
    }

    traps.set(propertyKey, filter);

    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get: () => tasks.trapped.get(prototype.constructor)?.[propertyKey],
      set: Function.prototype as (...args: any[]) => void
    });
  };

}

/**
 * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 *
 * @decorator [Target][]
 * @decorator [Singleton][]
 *
 * @see [RouterTask][]
 */
@Target<typeof CatchTask>()
@Singleton<typeof CatchTask>()
export class CatchTask
  extends Provider<typeof RouterTask>('sgrud.shell.router.RouterTask') {

  /**
   *
   */
  public readonly trapped: Map<Function, Record<PropertyKey, any>>;

  /**
   *
   */
  public readonly traps: Map<Function, Map<PropertyKey, Catch>>;

  /**
   * [Factor]: https://sgrud.github.io/client/functions/core.Factor
   *
   * @decorator [Factor][]
   */
  @Factor(() => Router)
  private readonly router!: Router;

  /**
   *
   */
  public constructor() {
    super();

    this.trapped = new Map<Function, Record<PropertyKey, any>>();
    this.traps = new Map<Function, Map<PropertyKey, Catch>>();
  }

  /**
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   * [Task]: https://sgrud.github.io/client/interfaces/shell.Router-1.Task
   *
   * @param _prev - Previously active [Router][] [State][] (ignored).
   * @param next - Next [Router][] [State][] to be activated.
   * @param handler - Next [Router][] [Task][] handler.
   * @returns Next handled [Router][] [State][].
   * @throws [Observable][] of an Error.
   */
  public override handle(
    _prev: Router.State,
    next: Router.State,
    handler: Router.Task
  ): Observable<Router.State> {
    if (this.traps.size) {
      return race(
        this.handleErrors(),
        handler.handle(next)
      ).pipe(catchError((error) => {
        let segment = this.router.spool(next.segment, false);
        let trapped;

        loop: do {
          delete (segment as Mutable<Router.Segment>).child;

          if (segment.route.component) {
            let constructor = customElements.get(segment.route.component) as (
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
                      this.trapped.set(constructor!, {
                        [key]: error
                      });

                      return this.router.navigate(route).pipe(
                        finalize(() => this.trapped.delete(constructor!))
                      );
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
          loop: for (const [target, traps] of this.traps) {
            const constructor = target.prototype[component] || target;
            const selector = customElements.getName(constructor);
            const route = selector && this.router.lookup(selector);

            if (TypeOf.string(route) && traps.size) {
              for (const [key, trap] of traps) {
                const handle = trap?.(error);

                if (handle || !trap) {
                  trapped = defer(() => {
                    this.trapped.set(constructor, {
                      [key]: error
                    });

                    return this.router.navigate(route).pipe(
                      finalize(() => this.trapped.delete(constructor))
                    );
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

    return handler.handle(next);
  }

  /**
   * [NEVER]: https://rxjs.dev/api/index/const/NEVER
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @returns [Observable][] that [NEVER][] completes.
   * @throws [Observable][] of an Error.
   */
  private handleErrors(): Observable<any> {
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
