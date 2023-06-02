import { Linker, Provider, Singleton } from '@sgrud/core';
import { Observable, ObservableInput, defer, finalize, forkJoin, from, switchMap, tap } from 'rxjs';
import { Component, component } from '../component/component';
import { customElements } from '../component/registry';
import { Router } from '../router/router';
import { Queue } from './queue';

/**
 * The **Resolve** type alias is used and intended to be used in conjunction
 * with the {@link ResolveQueue} {@link Queue} and the {@link Resolve}
 * decorator. The **Resolve** type alias represents a function that will be
 * called with the respective {@link Router.Segment} and {@link Router.State}.
 *
 * @typeParam S - The {@link Route} path string type.
 *
 * @see {@link Resolve}
 */
export type Resolve<S extends string> = (

  /**
   * The {@link Router.Segment} of the {@link Resolve}d {@link Component}.
   */
  segment: Router.Segment<S>,

  /**
   * The {@link Router.State} of the {@link Resolve}d {@link Component}.
   */
  state: Router.State<S>

) => ObservableInput<unknown>;

/**
 * {@link Component} prototype property decorator factory. Applying the
 * **Resolve** decorator to a property of a {@link Component}, while supplying
 * an {@link ObservableInput} to be `resolve`d, will replace the decorated
 * property with a getter returning the **Resolve**d value the supplied
 * {@link ObservableInput} `resolve`s to. To do so the **Resolve** decorator
 * relies on the built-in {@link ResolveQueue}.
 *
 * @param resolve - An {@link ObservableInput} to `resolve`.
 * @typeParam S - The {@link Route} path string type.
 * @returns A {@link Component} prototype property decorator.
 *
 * @example
 * **Resolve** the {@link Router.Segment} and {@link Router.State}:
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
 * @see {@link ResolveQueue}
 */
export function Resolve<S extends string>(resolve: Resolve<S>) {

  /**
   * @param prototype - The {@link Component} `prototype` to be decorated.
   * @param propertyKey - The {@link Component} property to be decorated.
   */
  return function(prototype: Component, propertyKey: PropertyKey): void {
    const linker = new Linker();
    const queued = new ResolveQueue();
    let required = queued.required.get(prototype.constructor);

    if (!linker.has(ResolveQueue)) {
      linker.set(ResolveQueue, queued);
    }

    if (!required) {
      required = new Map<PropertyKey, Resolve<string>>();
      queued.required.set(prototype.constructor, required);
    }

    required.set(propertyKey, resolve as unknown as Resolve<string>);

    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get(this: Component) {
        return queued.resolved.get(prototype.constructor)?.[propertyKey];
      },
      set(this: Component, value: unknown): void {
        if (this.isConnected) {
          let resolved = queued.resolved.get(prototype.constructor);

          if (!resolved) {
            queued.resolved.set(prototype.constructor, resolved = {});
          }

          resolved[propertyKey] = value;
        }
      }
    });
  };

}

/**
 * This built-in **ResolveQueue** extension of the {@link Queue} base class
 * intercepts all navigational events of the {@link Router} to {@link Resolve}
 * {@link ObservableInput}s before invoking subsequent {@link Queue}s. Thereby
 * this **ResolveQueue** allows asynchronous evaluations to be executed and
 * their {@link Resolve}d values to be provided to a {@link Component}, before
 * it is rendered into a {@link Document} for the first time. When the
 * {@link Catch} decorator is applied at least once this **ResolveQueue** will
 * be automatically provided as {@link Queue} to the {@link Linker}.
 *
 * @decorator {@link Singleton}
 *
 * @see {@link Queue}
 */
@Singleton()
export class ResolveQueue
  extends Provider<typeof Queue>('sgrud.shell.Queue') {

  /**
   * {@link Map}ping of all decorated {@link Component}s to a {@link Map} of
   * property keys and their **required** {@link Resolve}rs.
   */
  public readonly required: Map<Function, Map<PropertyKey, Resolve<string>>>;

  /**
   * {@link Map}ping of all decorated {@link Component}s to an object consisting
   * of property keys and their corresponding {@link Resolve}d return values.
   */
  public readonly resolved: Map<Function, Record<PropertyKey, unknown>>;

  /**
   * Public {@link Singleton} **constructor**. Called by the {@link Resolve}
   * decorator to link this {@link Queue} into the {@link Router} and to access
   * the {@link required} and {@link resolved} properties.
   */
  public constructor() {
    super();

    this.required = new Map<Function, Map<PropertyKey, Resolve<string>>>();
    this.resolved = new Map<Function, Record<PropertyKey, unknown>>();
  }

  /**
   * Overridden **handle** method of the {@link Queue} base class. Iterates all
   * {@link Router.Segment}s of the `next` {@link Router.State} and collects all
   * {@link Resolve}rs for any encountered {@link Component}s in those iterated
   * {@link Router.Segment}s. The collected {@link Resolve}rs are run before
   * invoking the subsequent {@link Queue}.
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
    return defer(() => {
      const components = [] as Function[];
      const resolvers = [];
      let segment = next.segment;

      do {
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
            const required = this.required.get(constructor);

            if (required?.size) {
              components.push(constructor);
              const require = {} as Record<PropertyKey, Observable<unknown>>;

              for (const [key, handler] of required) {
                require[key] = from(handler(segment, next));
              }

              resolvers.push(forkJoin(require).pipe(
                tap((resolved) => this.resolved.set(constructor!, resolved))
              ));
            }
          }
        }
      } while (segment = segment.child!);

      if (resolvers.length) {
        return forkJoin(resolvers).pipe(
          switchMap(() => queue.handle(next)),
          finalize(() => {
            for (const [key] of this.resolved) {
              if (!components.includes(key)) {
                this.resolved.delete(key);
              }
            }
          })
        );
      }

      return queue.handle(next);
    });
  }

}
