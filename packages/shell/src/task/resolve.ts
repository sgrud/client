import { Provider, Singleton, Target } from '@sgrud/core';
import { forkJoin, Observable, switchMap, tap } from 'rxjs';
import { component, Component } from '../component/component';
import { customElements } from '../component/registry';
import { Router } from '../router/router';
import { RouterTask } from '../router/task';

/**
 * The **Resolve** type alias is used and intended to be used in conjunction
 * with the [ResolveTask][] [RouterTask][] and the [Resolve][] decorator. The
 * **Resolve** type alias represents a function that will be called with the
 * respective [Segment][] and [State][].
 *
 * [Resolve]: https://sgrud.github.io/client/functions/shell.Resolve-1
 * [ResolveTask]: https://sgrud.github.io/client/classes/shell.ResolveTask
 * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
 * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
 * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
 *
 * @typeParam S - Route path string type.
 *
 * @see [Resolve][]
 */
export type Resolve<S extends string> = (

  /**
   * Resolved router [Segment][].
   *
   * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
   */
  segment: Router.Segment<S>,

  /**
   * Resolved router [State][].
   *
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   */
  state: Router.State<S>

) => Observable<any>;

/**
 * [Component][] prototype property decorator factory. Applying the **Resolve**
 * decorator to a property of a [Component][], while supplying a `task` to
 * [Resolve][]d, will replace the decorated property with a getter returning the
 * value the supplied `task` [Resolve][]s to. To do so the **Resolve** decorator
 * relies on the built-in [ResolveTask][] [RouterTask][].
 *
 * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
 * [Resolve]: https://sgrud.github.io/client/types/shell.Resolve
 * [ResolveTask]: https://sgrud.github.io/client/classes/shell.ResolveTask
 * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
 * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
 * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
 *
 * @param task - `task` to **resolve**.
 * @typeParam S - Route path string type.
 * @returns [Component][] prototype property decorator.
 *
 * @example
 * **Resolve** the [Segment][] path and [State][] search strings:
 * ```tsx
 * import { Component, Resolve } from '@sgrud/shell';
 * import { of } from 'rxjs';
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
 *   ⁠@Resolve((segment, state) => of([segment.route.path, state.search]))
 *   public readonly resolved!: [string, string];
 *
 *   public get template(): JSX.Element {
 *     return <span>Resolved: {this.resolved.join('?')}</span>;
 *   }
 *
 * }
 * ```
 *
 * @see [ResolveTask][]
 */
export function Resolve<S extends string>(task: Resolve<S>) {

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
    const tasks = new ResolveTask();
    let required = tasks.required.get(prototype.constructor);

    if (!required) {
      required = new Map<PropertyKey, Resolve<string>>();
      tasks.required.set(prototype.constructor, required);
    }

    required.set(propertyKey, task as Resolve<any>);

    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get: () => tasks.resolved.get(prototype.constructor)?.[propertyKey],
      set: Function.prototype as (...args: any[]) => void
    });
  };

}

/**
 * Built-in [RouterTask][] intercepting all navigational events of the
 * [Router][] to resolve [Resolve][] tasks before invoking subsequent
 * [RouterTask][]s.
 *
 * [Resolve]: https://sgrud.github.io/client/functions/shell.Resolve-1
 * [Router]: https://sgrud.github.io/client/classes/shell.Router
 * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 *
 * @decorator [Target][]
 * @decorator [Singleton][]
 *
 * @see [RouterTask][]
 */
@Target<typeof ResolveTask>()
@Singleton<typeof ResolveTask>()
export class ResolveTask
  extends Provider<typeof RouterTask>('sgrud.shell.router.RouterTask') {

  /**
   * Mapping of all [Component][]s to a map of property keys and their
   * corresponding [Resolve][] tasks.
   *
   * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
   * [Resolve]: https://sgrud.github.io/client/functions/shell.Resolve-1
   */
  public readonly required: Map<Function, Map<PropertyKey, Resolve<string>>>;

  /**
   * Mapping of all [Component][]s to an object consisting of property keys
   * and their corresponding [Resolve][] tasks return values.
   *
   * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
   * [Resolve]: https://sgrud.github.io/client/functions/shell.Resolve-1
   */
  public readonly resolved: Map<Function, Record<PropertyKey, any>>;

  /**
   * Public constructor. Called by the [Target][] decorator to link this
   * [RouterTask][] into the [Router][].
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
   * [Target]: https://sgrud.github.io/client/functions/core.Target
   */
  public constructor() {
    super();

    this.required = new Map<Function, Map<PropertyKey, Resolve<string>>>();
    this.resolved = new Map<Function, Record<PropertyKey, any>>();
  }

  /**
   * Overridden *handle* method of the [RouterTask][] base class. Iterates all
   * [Segment][]s of the `next` [State][] and collects all [Resolve][] tasks for
   * encountered [Component][]s in those [Segment][]s. The collected tasks are
   * resolved before invoking the subsequent [RouterTask][].
   *
   * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
   * [Resolve]: https://sgrud.github.io/client/functions/shell.Resolve-1
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
   * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   * [Task]: https://sgrud.github.io/client/interfaces/shell.Router-1.Task
   *
   * @param _prev - Previously active [Router][] [State][] (ignored).
   * @param next - Next [Router][] [State][] to be activated.
   * @param handler - Next [Router][] [Task][] handler.
   * @returns Next handled [Router][] [State][].
   */
  public override handle(
    _prev: Router.State,
    next: Router.State,
    handler: Router.Task
  ): Observable<Router.State> {
    if (this.required.size) {
      this.resolved.clear();
      const forks = [];
      let segment = next.segment;

      do {
        if (segment.route.component) {
          let constructor = customElements.get(segment.route.component) as (
            CustomElementConstructor & { [component]?: new () => Component }
          ) | undefined;

          if (constructor) {
            constructor = constructor[component] || constructor;
            const required = this.required.get(constructor);

            if (required?.size) {
              const tasks = { } as Record<PropertyKey, Observable<any>>;

              for (const [key, task] of required) {
                tasks[key] = task(segment, next);
              }

              forks.push(forkJoin(tasks).pipe(
                tap((resolved) => this.resolved.set(constructor!, resolved))
              ));
            }
          }
        }

      } while (segment = segment.child!);

      if (forks.length) {
        return forkJoin(forks).pipe(
          switchMap(() => handler.handle(next))
        );
      }
    }

    return handler.handle(next);
  }

}
