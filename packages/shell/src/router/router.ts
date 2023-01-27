import { assign, Linker, Mutable, Singleton, Symbol, Target, TypeOf } from '@sgrud/core';
import { BehaviorSubject, defer, Observable, of, onErrorResumeNext, Subscribable, throwError, throwIfEmpty } from 'rxjs';
import { createElement, render } from '../component/runtime';
import { Route } from './route';
import { RouterTask } from './task';

/**
 * Namespace containing types and interfaces used and intended to be used in
 * conjunction with the [Singleton][] [Router][] class.
 *
 * [Router]: https://sgrud.github.io/client/classes/shell.Router
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @see [Router][]
 */
export namespace Router {

  /**
   * String literal helper type. Represents the **left** part of a path.
   *
   * @typeParam S - Route path string type.
   *
   * @example
   * **Left** of `'nested/route/path'`:
   * ```ts
   * import type { Router } from '@sgrud/shell';
   *
   * const left: Router.Left<'nested/route/path'>; // 'nested'
   * ```
   */
  export type Left<S extends string> = S extends `${infer I}/${string}` ? I : S;

  /**
   * Type helper representing the (optional) **Params** of a [Route][] path. By
   * extracting string literals starting with a colon (and optionally ending on
   * a question mark), a union type of a key/value pair for each parameter is
   * created.
   *
   * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
   *
   * @typeParam S - Route path string type.
   *
   * @example
   * Extract parameters from `'item/:id/field/:name?'`:
   * ```ts
   * import type { Router } from '@sgrud/shell';
   *
   * const params: Router.Params<'item/:id/field/:name?'>;
   * // { id: string; name?: string; }
   * ```
   */
  export type Params<S> = S extends `${string}:${infer P}` ? (
    P extends `${Left<P>}${infer I}`
      ? Params<I>
      : never
  ) & (
    Left<P> extends `${infer I}?`
      ? { [K in I]?: string }
      : { [K in Left<P>]: string }
  ) : { };

  /**
   * Interface describing the shape of a [Router][] **Segment**. A **Segment**
   * represents a navigated [Route][] and its corresponding [Params][]. As
   * [Route][]s are represented in a tree-like structure and one **Segment**
   * represents one layer within the [Route][]-tree, each **Segment** may have a
   * *parent* and/or a *child*. The resulting graph of **Segment**s represents
   * the navigated path through the underlying [Route][]-tree.
   *
   * [Params]: https://sgrud.github.io/client/types/shell.Router-1.Params
   * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   *
   * @typeParam S - Route path string type.
   */
  export interface Segment<S extends string = string> {

    /**
     * Optional **child** of this *Segment*.
     */
    readonly child?: Segment;

    /**
     * [Route][] path [Params][] and corresponding values.
     *
     * [Params]: https://sgrud.github.io/client/types/shell.Router-1.Params
     * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
     */
    readonly params: Params<S>;

    /**
     * Optional **parent** of this *Segment*.
     */
    readonly parent?: Segment;

    /**
     * [Route][] associated to this *Segment*.
     *
     * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
     */
    readonly route: Route<S>;

  }

  /**
   * Interface describing the shape of a [Router][] **State**. [Router][]
   * **State**s correspond to the browser history, as each navigation results in
   * a new **State** being created. Each navigated **State** is represented by
   * its absolute *path*, a [Segment][] as entrypoint to the graph-like
   * representation of the navigated path through the route-tree and *search*
   * parameters.
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
   *
   * @typeParam S - Route path string type.
   */
  export interface State<S extends string = string> {

    /**
     * Absolute **path** of the [Router][] *State*.
     *
     * [Router]: https://sgrud.github.io/client/classes/shell.Router
     */
    readonly path: S;

    /**
     * **Search** parameters of the [Router][] *State*.
     *
     * [Router]: https://sgrud.github.io/client/classes/shell.Router
     */
    readonly search: string;

    /**
     * [Segment][] of the [Router][] *State*.
     *
     * [Router]: https://sgrud.github.io/client/classes/shell.Router
     * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
     */
    readonly segment: Segment<S>;

  }

  /**
   * Interface describing the shape of a [RouterTask][]. These **Task**s are run
   * whenever a navigation is triggered and may intercept and mutate the next
   * [State][] or completely block or redirect a navigation.
   *
   * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   *
   * @see [RouterTask][]
   */
  export interface Task {

    /**
     * Method called when a navigation was triggered.
     *
     * [Observable]: https://rxjs.dev/api/index/class/Observable
     * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
     *
     * @param next - Next [State][] to be handled.
     * @returns [Observable][] of handled [State][].
     */
    handle(next: State): Observable<State>;

  }

}

/**
 * [Target][]ed [Singleton][] Router class extending the built-in *Set*. This
 * [Singleton][] class provides routing and rendering capabilities. Routing is
 * primarily realized by maintaining (inheriting) a *Set* of [Route][]s and
 * (recursively) *match*ing paths against those [Route][]s, when instructed so
 * by calling *navigate*. When a matching [Segment][] is found, the
 * corresponding [Component][]s are rendered by the *handle* method (which is
 * part of the implemented [Task][] contract).
 *
 * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
 * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
 * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 * [Task]: https://sgrud.github.io/client/interfaces/shell.Router-1.Task
 *
 * @decorator [Target][]
 * @decorator [Singleton][]
 */
@Target<typeof Router>()
@Singleton<typeof Router>()
export class Router extends Set<Route> implements Router.Task {

  /**
   *
   */
  declare public readonly [Symbol.iterator]: never;

  /**
   * Absolute **baseHref** for navigation.
   */
  public readonly baseHref: string;

  /**
   * Wether to employ **hashBased** routing.
   */
  public readonly hashBased: boolean;

  /**
   * Rendering **outlet** for navigated [Route][]s.
   *
   * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
   */
  public readonly outlet: DocumentFragment | Element;

  /**
   * Internally used [BehaviorSubject][] containing and emitting every navigated
   * [State][].
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   */
  private readonly changes: BehaviorSubject<Router.State>;

  /**
   * Getter mirroring the current value of the *changes* [BehaviorSubject][].
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   */
  public get state(): Router.State {
    return this.changes.value;
  }

  /**
   * [Singleton][] *Router* class **constructor**. This **constructor** is
   * called once by the [Target][] decorator and sets initial values on the
   * instance. All subsequent calls will return the previously constructed
   * [Singleton][] instance of this class.
   *
   * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
   * [Target]: https://sgrud.github.io/client/functions/core.Target
   */
  public constructor() {
    super();

    this.baseHref = '/';
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
   * Well-known `Symbol.observable` method returning a [Subscribable][]. The
   * returned [Subscribable][] emits the current [State][] and every time this
   * *changes*.
   *
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   * [Subscribable]: https://rxjs.dev/api/index/interface/Subscribable
   *
   * @returns [Subscribable][] emitting [State][] changes.
   *
   * @example
   * Subscribe to the *Router*:
   * ```ts
   * import { Router } from '@sgrud/shell';
   * import { from } from 'rxjs';
   *
   * from(new Router()).subscribe(console.log);
   * ```
   */
  public [Symbol.observable](): Subscribable<Router.State> {
    return this.changes.asObservable();
  }

  /**
   * Overridden **add** method. Invoking this method while supplying a `route`
   * will **add** the supplied `route` to the *Router* after deleting its child
   * [Route][]s from the *Router*, thereby ensuring that only top-most/root
   * `route`s remain part of the *Router*.
   *
   * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
   *
   * @param route - [Route][] to **add**.
   * @returns This instance.
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
   * **Bind**ing helper method. Calling this method will **bind** a handler to
   * the global `onpopstate` event, invoking *navigate* with the appropriate
   * arguments. This method furthermore allows the properties *baseHref*,
   * *hashBased* and *outlet* to be overridden. Invoking the **bind** method
   * throws an error if called more than once, without invoking the *unbind*
   * method in between.
   *
   * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
   *
   * @param this - Mutable polymorphic `this`.
   * @param outlet - Rendering outlet for navigated [Route][]s.
   * @param baseHref - Absolute baseHref for navigation.
   * @param hashBased - Wether to employ hashBased routing.
   * @throws ReferenceError.
   */
  public bind(
    this: Mutable<this>,
    outlet: DocumentFragment | Element = this.outlet,
    baseHref: string = this.baseHref,
    hashBased: boolean = this.hashBased
  ): void {
    if (!TypeOf.window(globalThis.window) || window.onpopstate) {
      throw new ReferenceError('window.onpopstate');
    }

    window.onpopstate = (event) => {
      const { search, segment } = event.state as Router.State;
      this.navigate(segment, search).subscribe();
    };

    if ((
      this.hashBased = !navigator.webdriver && hashBased
    ) && !baseHref.endsWith('#!/')) {
      baseHref += '#!/';
    }

    this.baseHref = baseHref;
    this.outlet = outlet;
  }

  /**
   * Implementation of the **handle** method as required by the [Task][]
   * interface contract. This method is called internally by the *match* method
   * after all [RouterTask][]s have been invoked. It is therefore considered the
   * default or fallback [RouterTask][] and handles the rendering of the
   * supplied `state`.
   *
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   * [Task]: https://sgrud.github.io/client/interfaces/shell.Router-1.Task
   *
   * @param state - *Router* [State][] to handle.
   * @param replace - Wether to replace the [State][].
   * @returns [Observable][] of the handled [State][].
   */
  public handle(
    state: Router.State,
    replace: boolean = false
  ): Observable<Router.State> {
    return defer(() => {
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

      render(this.outlet, template);

      if (replace) {
        history.replaceState(state, '', this.rebase(state.path));
      } else {
        history.pushState(state, '', this.rebase(state.path));
      }

      this.changes.next(state);
      return of(state);
    });
  }

  /**
   * [Segment][] **join**ing helper. The supplied `segment` is converted to a
   * string by *spool*ing to its top-most parent and iterating through all
   * children while concatenating every encountered path. If said path is an
   * (optional) parameter, this portion of the returned string is replaced by
   * the respective [Params][] value.
   *
   * [Params]: https://sgrud.github.io/client/types/shell.Router-1.Params
   * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
   *
   * @param segment - [Segment][] to be **join**ed.
   * @returns **Join**ed [Segment][] as string.
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
          path = segment.params[key as keyof typeof segment.params];
        }

        if (path) {
          parts.push(path);
        }
      }
    } while (segment = segment.child!);

    return parts.join('/');
  }

  /**
   * **Lookup** helper method. Calling this method while supplying a `selector`
   * and optionally an iterable of `routes` will return the **lookup**ed
   * [Route][] path for the supplied `selector` or `undefined`, if it does not
   * occur within at least one route. When multiple occurrences of the same
   * `selector` exist, the [Route][] path to its first occurrence is returned.
   *
   * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
   * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
   *
   * @param selector - [Component][] tag name.
   * @param routes - Routes to use for **lookup**.
   * @returns Resolved [Route][] path or `undefined`.
   */
  public lookup(
    selector: string,
    routes: Iterable<Route> = this
  ): string | undefined {
    for (const route of routes) {
      if (route.component === selector) {
        return route.path;
      } else if (route.children?.length) {
        const path = this.lookup(selector, route.children);

        if (TypeOf.string(path)) {
          return path ? `${route.path}/${path}` : route.path;
        }
      }
    }

    return undefined;
  }

  /**
   * Main *Router* **match**ing method. Calling this method while supplying a
   * `path` and optionally an array of `routes` will return a **match**ing
   * [Segment][] or undefined, if no match was found. If no `routes` are
   * supplied, routes previously added to the *Router* will be used. The
   * **match** method represents the backbone of the *Router* class, as it,
   * given a list of `routes` and a `path`, will determine wether this path
   * represents a **match** within the list of `routes`, thereby effectively
   * determining navigational integrity.
   *
   * [Route]: https://sgrud.github.io/client/interfaces/shell.Route-1
   * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
   *
   * @param path - Path to **match** against.
   * @param routes - [Route][]s to use for **match**ing.
   * @returns **Match**ing [Segment][] or undefined.
   *
   * @example
   * Test if path `'example/route'` **match**es `child` or `route`:
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
   * router.match(path, [child]); // false
   * router.match(path, [route]); // true
   * ```
   */
  public match(
    path: string,
    routes: Route[] = Array.from(this)
  ): Router.Segment | undefined {
    loop: for (const route of routes) {
      const parts = route.path.split('/');
      const paths = path.split('/');
      const segment = {
        params: { },
        route
      };

      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === paths[i]) {
          continue;
        } else if (!i && !parts[i]) {
          let index = routes.indexOf(route);

          if (index || ++index < routes.length) {
            const match = this.match(path, routes.slice(index));
            if (match) return match;
          }

          parts.splice(i--, 1);
          continue;
        } else if (parts[i].startsWith(':')) {
          let key = parts[i].slice(1);

          if (parts[i].endsWith('?')) {
            key = key.slice(0, key.length - 1);
            const left = paths.slice(0, i).concat(parts[i]);
            left.push(...paths.slice(paths[i] ? i : i + 1));
            const match = this.match(left.join('/'), [route]);

            if (match) {
              return assign(match, {
                params: assign(match.params, {
                  [key]: undefined
                }),
                path
              });
            }
          }

          if (paths[i]) {
            assign(segment.params, {
              [key]: paths[i]
            });

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

      if (parts.length < paths.length) {
        continue loop;
      }

      return segment;
    }

    return undefined;
  }

  /**
   * Main navigation method. Calling this method while supplying either a path
   * or [Segment][] as navigation `target` (and optional `search` parameters)
   * will normalize the path by trying to *match* a respective [Segment][] or
   * directly use the supplied [Segment][] as next [State][]. This upcoming
   * [State][] is looped through all linked [RouterTask][]s and finally
   * *handle*d by the *Router* itself to render the resulting, possibly
   * intercepted and mutated [State][].
   *
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
   * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
   * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
   *
   * @param target - Path or [Segment][] to **navigate** to.
   * @param search - Optional search parameters.
   * @param replace - Wether to replace the [State][].
   * @returns [Observable][] of the *Router* [State][].
   * @throws [Observable][] of an URIError.
   */
  public navigate(
    target: string | Router.Segment,
    search?: string,
    replace: boolean = false
  ): Observable<Router.State> {
    const prev = this.changes.value;
    const task = (next: Router.State) => this.handle(next, replace);
    const tasks = new Linker<typeof RouterTask>().getAll(RouterTask);

    if (TypeOf.string(target)) {
      const url = new URL(target, location.origin);
      const { hash, pathname: path, search: params } = url;
      const match = this.match(this.rebase(path + hash, false));

      if (!match) {
        const error = () => new URIError(path + hash);
        const handle = () => throwError(error);
        const next = {
          path: path + hash,
          search: params,
          segment: {
            params: { },
            route: {
              path: path + hash
            }
          }
        };

        return onErrorResumeNext(tasks.map((handler) => {
          return handler.handle(prev, next, { handle });
        })).pipe(throwIfEmpty(error));
      }

      target = match;
      search ??= params;
    } else {
      target = this.spool(target);
    }

    return (function handle(next: Router.State): Observable<Router.State> {
      return tasks.shift()?.handle(prev, next, { handle }) || task(next);
    })({
      path: this.join(target),
      search: search ?? '',
      segment: target
    });
  }

  /**
   * Rebasing helper method. **Rebase**s the supplied `path` against the current
   * *baseHref*, by either prepending the *baseHref* to the supplied `path` or
   * stripping it, depending on the `prefix` argument.
   *
   * @param path - Path to **rebase** against the *baseHref*.
   * @param prefix - Wether to prepend or strip the *baseHref*.
   * @returns **Rebase**d `path`.
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
      let n = 0; while (n < path.length && path[n] === this.baseHref[n]) n++;
      return path.slice(n);
    }

    return path;
  }

  /**
   * **Spool**ing helper method. Given a `segment` (and wether to `rewind`), the
   * top-most parent (or deepest child) of the graph-link [Segment][] is
   * returned.
   *
   * [Segment]: https://sgrud.github.io/client/interfaces/shell.Router-1.Segment
   *
   * @param segment - [Segment][] to **spool**.
   * @param rewind - **Spool** direction.
   * @returns **Spool**ed [Segment][].
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
   * **Unbind**ing helper method. Calling this method (after calling *bind*)
   * will **unbind** the previously bound handler from the global `onpopstate`
   * event. Further, the arguments passed to *bind* are revoked, meaning the
   * default values of the properties *baseHref*, *hashBased* and *outlet* are
   * restored. Calling this method without previously *bind*ing the *Router*
   * will throw an error.
   *
   * @param this - Mutable polymorphic `this`.
   * @throws ReferenceError.
   */
  public unbind(
    this: Mutable<this>
  ): void {
    if (!TypeOf.window(globalThis.window) || !window.onpopstate) {
      throw new ReferenceError('window.onpopstate');
    }

    this.baseHref = '/';
    this.hashBased = false;
    this.outlet = document.body;

    window.onpopstate = null;
  }

}
