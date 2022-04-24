import { assign, Linker, Mutable, Singleton, Target, TypeOf } from '@sgrud/core';
import { BehaviorSubject, EMPTY, filter, finalize, fromEvent, observable, Observable, of, Subscribable, Subscription, tap, throwError } from 'rxjs';
import { createElement, render } from '../component/runtime';
import { Route } from './route';
import { RouterTask } from './task';

/**
 * Namespace containing types and interfaces to be used in conjunction with the
 * singleton {@link Router} class.
 *
 * @see {@link Router}
 */
export namespace Router {

  /**
   * String literal helper type. Represents the leftest part of a path.
   *
   * @typeParam S - Route path string type.
   */
  export type Left<S extends string> = S extends `${infer L}/${string}` ? L : S;

  /**
   * Type helper representing the (optional) parameters of a path. By extracting
   * string literals starting with a colon (and optionally ending on a question
   * mark), a union type of a key/value pair for each parameter is created.
   *
   * @typeParam S - Route path string type.
   *
   * @example Extract parameters from path `'item/:id/field/:name?'`.
   * ```ts
   * import type { Router } from '@sgrud/shell';
   *
   * let params: Router.Params<'item/:id/field/:name?'>;
   * // { id: string; name?: string; }
   * ```
   */
  export type Params<S> = S extends `${string}:${infer P}` ? (
    Left<P> extends `${infer O}?`
      ? { [K in O]?: string }
      : { [K in Left<P>]: string }
  ) & (
    P extends `${Left<P>}${infer R}`
      ? Params<R>
      : never
  ) : { };

  /**
   * Interface describing the shape of a router segment. A segment represents a
   * navigated {@link Route} and its corresponding {@link Params}. As routes are
   * represented in a tree-like structure and one segment represents one layer
   * within the route-tree, each segment may have a {@link parent} and/or a
   * {@link child}. The resulting graph of segments represents the navigated
   * path through the underlying route-tree.
   *
   * @typeParam S - Route path string type.
   */
  export interface Segment<S extends string = string> {

    /**
     * Optional child of this segment.
     */
    readonly child?: Segment;

    /**
     * Route path parameters and corresponding values.
     */
    readonly params: Params<S>;

    /**
     * Optional parent of this segment.
     */
    readonly parent?: Segment;

    /**
     * Route associated to this segment.
     */
    readonly route: Route;

  }

  /**
   * Interface describing the shape of a router state. Router states correspond
   * to history states, as each navigation results in a new state being created.
   * Each navigated state is represented by the absolute navigated {@link path},
   * a {@link Segment} as entrypoint to the graph-like representation of the
   * navigated path through the route-tree and {@link search} parameters.
   *
   * @typeParam S - Route path string type.
   */
  export interface State<S extends string = string> {

    /**
     * Absolute path of the router state.
     */
    readonly path: S;

    /**
     * Search parameters of the router state.
     */
    readonly search: string;

    /**
     * Segment of the router state.
     */
    readonly segment: Segment<S>;

  }

  /**
   * Interface describing the shape of a {@link RouterTask}. These tasks are run
   * whenever a navigation is triggered and may intercept and mutate the next
   * state or completely block or redirect a navigation.
   *
   * @see {@link RouterTask}
   */
  export interface Task {

    /**
     * Method called when a navigation was triggered.
     *
     * @param next - Next state to be handled.
     * @returns Observable of handled state.
     */
    handle(next: State): Observable<State>;

  }

}

/**
 * Targeted singleton Router class extending `Set<Route>`. This singleton class
 * provides routing and rendering capabilities. Routing is primarily realized by
 * maintaining (inheriting) a set of routes and (recursively) {@link match}ing
 * paths against those routes, when instructed so by calling {@link navigate}.
 * When a matching {@link Segment} is found, the corresponding components are
 * rendered by the {@link handle} method (part of the {@link Task} contract).
 *
 * @decorator {@link Target}
 * @decorator {@link Singleton}
 */
@Target<typeof Router>()
@Singleton<typeof Router>()
export class Router extends Set<Route> implements Router.Task {

  /**
   * Symbol property typed as callback to a Subscribable. The returned
   * Subscribable emits the current {@link Router.State} and every time this
   * changes.
   *
   * @returns Callback to a Subscribable.
   *
   * @example Subscribe to the router.
   * ```ts
   * import { Linker } from '@sgrud/core';
   * import { Router } from '@sgrud/shell';
   * import { from } from 'rxjs';
   *
   * const router = new Linker<typeof Router>().get(Router);
   * from(router).subscribe(console.log);
   * ```
   */
  public readonly [Symbol.observable]: () => Subscribable<Router.State>;

  /**
   * Absolute base href for navigation.
   */
  public readonly baseHref: string;

  /**
   *
   */
  public readonly bond: Subscription;

  /**
   * Wether to employ hash-based routing.
   */
  public readonly hashBased: boolean;

  /**
   * Navigated route rendering outlet.
   */
  public readonly outlet: DocumentFragment | Element;

  /**
   * Internally used behavior subject containing and emitting every navigated
   * {@link Router.State}.
   */
  private readonly changes: BehaviorSubject<Router.State>;

  /**
   * `rxjs.observable` interop getter returning a callback to a Subscribable.
   */
  public get [observable](): () => Subscribable<Router.State> {
    return () => this.changes.asObservable();
  }

  /**
   * Getter mirroring the current value of the {@link changes} behavior subject.
   */
  public get state(): Router.State {
    return this.changes.value;
  }

  /**
   * Singleton router class constructor. This constructor is called once by the
   * {@link Target} decorator and sets initial values on the instance. All
   * subsequent calls will return the previously constructed singleton instance.
   */
  public constructor() {
    super();

    this.baseHref = '/';
    this.bond = EMPTY.subscribe();
    this.hashBased = false;
    this.outlet = document.body;

    this.changes = new BehaviorSubject<Router.State>({
      path: '',
      search: '',
      segment: {
        params: { },
        route: {
          path: ''
        }
      }
    });
  }

  /**
   * Overridden `Set.prototype.add` method. Invoking this method while supplying
   * a `route` will add the supplied `route` to the router after deleting its
   * child routes from the router, thereby ensuring that only top-most/root
   * `route`s remain part of the router.
   *
   * @param route - Route to add to the set.
   * @returns This router instance.
   */
  public override add(route: Route): this {
    if (route.children?.length) {
      for (const child of route.children) {
        this.delete(child);
      }
    }

    return super.add(route);
  }

  /**
   * Binding helper method. Calling this method will bind a handler to the
   * `window.onpopstate` event, invoking {@link navigate} with the state of the
   * `PopStateEvent`. This method furthermore allows the default and readonly
   * properties {@link baseHref}, {@link hashBased} and {@link outlet} to be
   * overridden. This method throws an error if called more than once, without
   * calling the {@link unbind} method in between.
   *
   * @param this - Mutable polymorphic this.
   * @param outlet - Navigated route rendering outlet.
   * @param baseHref - Absolute base href for navigation.
   * @param hashBased - Wether to employ hash-based routing.
   */
  public bind(
    this: Mutable<this>,
    outlet: DocumentFragment | Element = this.outlet,
    baseHref: string = this.baseHref,
    hashBased: boolean = this.hashBased
  ): void {
    if (!this.bond.closed) {
      throw new RangeError();
    }

    const teardown = {
      baseHref: this.baseHref,
      hashBased: this.hashBased,
      outlet: this.outlet
    };

    this.bond = fromEvent<PopStateEvent>(window, 'popstate').pipe(
      filter((event) => event.state)
    ).pipe(
      finalize(() => assign(this, teardown))
    ).subscribe((event) => {
      const { search, segment } = event.state as Router.State;
      this.navigate(segment, search).subscribe();
    });

    if ((
      this.hashBased = !navigator.webdriver && hashBased
    ) && !baseHref.endsWith('#!/')) {
      baseHref += '#!/';
    }

    this.baseHref = baseHref;
    this.outlet = outlet;
  }

  /**
   * Implementation of the {@link Router.Task.handle} method. This method is
   * called internally by the {@link match} method after all {@link RouterTask}s
   * have been invoked. It is therefore considered the default or fallback
   * {@link RouterTask} and handles the rendering of the supplied `state`.
   *
   * @param state - Router state to handle.
   * @param replace - Wether to replace the state.
   * @returns Observable of the handled state.
   */
  public handle(
    state: Router.State,
    replace: boolean = false
  ): Observable<Router.State> {
    return of(state).pipe(tap(() => {
      let segment = this.spool(state.segment, false);
      let template = [] as JSX.Element;

      do {
        if (segment.route.component) {
          const params = assign({ }, segment.params, { children: template });

          for (const key in segment.route.slots) {
            params.children.unshift(...createElement(segment.route.slots[key], {
              slot: key
            }));
          }

          template = createElement(segment.route.component, params);
        }
      } while (segment = segment.parent!);

      if (replace) {
        history.replaceState(state, '', this.rebase(state.path));
      } else {
        history.pushState(state, '', this.rebase(state.path));
      }

      render(this.outlet, template);
      this.changes.next(state);
    }));
  }

  /**
   * {@link Segment} joining helper. The supplied `segment` is converted to a
   * path by {@link spool}ing to its top-most parent and iterating through all
   * children while concatenating every encountered {@link Route.path}. If said
   * path represents a (optional) parameter, this portion of the path is
   * replaced by the respective {@link Segment.params} value.
   *
   * @param segment - Segment to be joined.
   * @returns Joined segment as string.
   */
  public join(segment: Router.Segment): string {
    const parts = [] as string[];
    segment = this.spool(segment);

    do {
      const paths = segment.route.path.split('/');

      for (let i = 0; i < paths.length; i++) {
        let path = paths[i];

        if (path.startsWith(':')) {
          const key = path.replace(/^:(.+?)\??$/, '$1');
          path = (segment.params as any)[key];
        }

        if (path) {
          parts.push(path);
        }
      }
    } while (segment = segment.child!);

    return parts.join('/');
  }

  /**
   * Main router matching method. Calling this method while supplying a `path`
   * and optionally an array of `routes` will return a matching {@link Segment}
   * or undefined, if no match was found. If no `routes` are supplied, routes
   * previously added to the router set will be used. This method represents the
   * backbone of the router, as it, given a list of `routes` and a `path`, will
   * determine wether this path hits a match within the list of `routes`,
   * thereby effectively determining navigational integrity.
   *
   * @param path - Path to match against.
   * @param routes - Routes to use for matching.
   * @returns Matching segment or undefined.
   *
   * @example Test if path `'example/route'` matches `child` or `route`.
   * ```ts
   * import { Router } from '@sgrud/shell';
   *
   * const path = 'example/route';
   * const router = new Router();
   *
   * const child = {
   *   path: 'route'
   * };
   *
   * const route = {
   *   path: 'example',
   *   children: [child]
   * };
   *
   * if (router.match(path, [child])) {
   *   // false
   * }
   *
   * if (router.match(path, [route])) {
   *   // true
   * }
   * ```
   */
  public match(
    path: string,
    routes?: Route[]
  ): Router.Segment | undefined {
    loop: for (const route of routes || this) {
      const parts = route.path.split('/');
      const paths = path.split('/');
      const segment = {
        params: { },
        route
      };

      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === paths[i]) {
          continue;
        } else if (!parts[i] && route.children?.length) {
          parts.splice(i, 1);
          continue;
        } else if (parts[i].startsWith(':')) {
          let key = parts[i].substring(1);

          if (parts[i].endsWith('?')) {
            key = key.substring(0, key.length - 1);
            const left = [...paths.slice(0, i), parts[i], ...paths.splice(i)];
            const match = this.match(left.join('/'), [route]);

            if (match) {
              return assign(match, {
                path,
                params: assign(match.params, {
                  [key]: undefined
                })
              });
            }
          }

          if (paths[i]) {
            assign(segment.params, { [key]: paths[i] });
            continue;
          }
        }

        continue loop;
      }

      if (route.children?.length) {
        const left = paths.slice(parts.length);
        const match = this.match(left.join('/'), route.children);

        if (match) {
          return assign(segment, {
            child: assign(match, {
              parent: segment
            })
          });
        }
      }

      return segment;
    }

    return undefined;
  }

  /**
   * Main navigation method. Calling this method while supplying either a path
   * or {@link Segment} as navigation `target` (and optional `search`
   * parameters) will normalize the path by trying to {@link match} a respective
   * {@link Segment} or directly use the supplied {@link Segment} as next
   * {@link State}. This upcoming state is looped through all linked
   * {@link RouterTask}s and finally {@link handle}d by the router itself to
   * render the resulting, possibly intercepted and mutated state.
   *
   * @param target - Path or segment to navigate to.
   * @param search - Optional search parameters.
   * @param replace - Wether to replace the state.
   * @returns Observable of the router state.
   */
  public navigate(
    target: string | Router.Segment,
    search?: string,
    replace: boolean = false
  ): Observable<Router.State> {
    if (TypeOf.string(target)) {
      const url = new URL(target, location.origin);
      const { hash, pathname, search: params } = url;

      const match = this.match(this.rebase(pathname + hash, false));
      if (!match) return throwError(() => new URIError(pathname));

      target = match;
      search ??= params;
    } else {
      target = this.spool(target);
    }

    const prev = this.changes.value;
    const task = (next: Router.State) => this.handle(next, replace);
    const tasks = new Linker<typeof RouterTask>().getAll(RouterTask);

    return (function handle(next: Router.State): Observable<Router.State> {
      return tasks.shift()?.handle(prev, next, { handle }) ?? task(next);
    })({
      path: this.join(target),
      search: search ?? '',
      segment: target
    });
  }

  /**
   * Rebasing helper method. Rebases the supplied `path` against the router
   * {@link baseHref}, by either prepending the {@link baseHref} to the supplied
   * `path` or stripping it, depending on the `prefix` argument.
   *
   * @param path - Path to rebase against the {@link baseHref}.
   * @param prefix - Wether to prepend or strip the {@link baseHref}.
   * @returns Rebased `path`.
   */
  public rebase(
    path: string,
    prefix: boolean = true
  ): string {
    if (prefix) {
      if (!path.startsWith(this.baseHref)) {
        return path.replace(/^\/?/, this.baseHref.replace(/\/?$/, '/'));
      }
    } else {
      let i = 0; while (i < path.length && path[i] === this.baseHref[i]) i++;
      return path.substring(i);
    }

    return path;
  }

  /**
   * Spooling helper method. Given a `segment` (and wether to `rewind`), the
   * top-most parent (or deepest child) of the graph-link {@link Segment} is
   * returned.
   *
   * @param segment - Segment to spool.
   * @param rewind - Spool direction.
   * @returns Spooled segment.
   */
  public spool(
    segment: Router.Segment,
    rewind: boolean = true
  ): Router.Segment {
    if (rewind) {
      while (segment.parent) {
        segment = segment.parent;
      }
    } else {
      while (segment.child) {
        segment = segment.child;
      }
    }

    return segment;
  }

  /**
   * Unbinding helper method. Calling this method (after calling {@link bind})
   * will unbind the previously bound handler from the `window.onpopstate`
   * event. Further, the arguments passed to {@link bind} are revoked, meaning
   * the default values of the properties {@link baseHref}, {@link hashBased}
   * and {@link outlet} are restored. Calling this method without previously
   * {@link bind}ing the router will throw an error.
   *
   * @param this - Mutable polymorphic this.
   */
  public unbind(
    this: Mutable<this>
  ): void {
    if (this.bond.closed) {
      throw new RangeError();
    }

    this.bond.unsubscribe();
  }

}
