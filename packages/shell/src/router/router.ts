import { assign, Linker, Mutable, Singleton, Symbol, Target, TypeOf } from '@sgrud/core';
import { asyncScheduler, BehaviorSubject, defer, first, Observable, onErrorResumeNext, ReplaySubject, Subscribable, throwError, throwIfEmpty } from 'rxjs';
import { createElement, render } from '../component/runtime';
import { Queue } from '../queue/queue';
import { Route } from './route';

/**
 * Namespace containing types and interfaces used and intended to be used in
 * conjunction with the {@link Singleton} {@link Router} class.
 *
 * @see {@link Router}
 */
export namespace Router {

  /**
   * Type alias constraining the possible {@link Router} **Action**s to `'pop'`,
   * `'push'` and `'replace'`. These **Action**s correspond loosely to possible
   * {@link History} events.
   */
  export type Action = 'pop' | 'push' | 'replace';

  /**
   * String literal helper type. Represents the **Left**est part of a
   * {@link Route} path.
   *
   * @typeParam S - The {@link Route} path string type.
   *
   * @example
   * **Left** of `'nested/route/path'`:
   * ```ts
   * import { type Router } from '@sgrud/shell';
   *
   * const left: Router.Left<'nested/route/path'>; // 'nested'
   * ```
   */
  export type Left<S extends string> = S extends `${infer I}/${string}` ? I : S;

  /**
   * Type helper representing the (optional) **Params** of a {@link Route} path.
   * By extracting string literals starting with a colon (and optionally ending
   * on a question mark), a union type of a key/value pair for each parameter is
   * created.
   *
   * @typeParam S - The {@link Route} path string type.
   *
   * @example
   * Extract **Params** from `'item/:id/field/:name?'`:
   * ```ts
   * import { type Router } from '@sgrud/shell';
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
  ) : {};

  /**
   * Interface describing the shape of a **Queue**. These **Queue**s are run
   * whenever a navigation is triggered and may intercept and mutate the next
   * {@link State} or completely block or redirect a navigation.
   *
   * @see {@link Queue}
   */
  export interface Queue {

    /**
     * **handle** method, called when a navigation was triggered.
     *
     * @param next - The `next` {@link State} to be **handle**d.
     * @returns An {@link Observable} of the **handle**d {@link State}.
     */
    handle(next: State): Observable<State>;

  }

  /**
   * Interface describing the shape of a {@link Router} **Segment**. A
   * **Segment** represents a {@link Router.navigate}d {@link Route} and its
   * corresponding {@link Params}. As {@link Route}s are represented in a
   * tree-like structure and one **Segment** represents one layer within the
   * {@link Route}-tree, each **Segment** may have a {@link Segment.parent}
   * and/or a {@link child}. The resulting graph of **Segment**s represents the
   * {@link Router.navigate}d path through the underlying {@link Route}-tree.
   *
   * @typeParam S - The {@link Route} path string type.
   */
  export interface Segment<S extends string = string> {

    /**
     * Optional **child** of this {@link Segment}.
     */
    readonly child?: Segment;

    /**
     * {@link Route} path {@link Params} and their corresponding values.
     */
    readonly params: Params<S>;

    /**
     * Optional **parent** of this {@link Segment}.
     */
    readonly parent?: Segment;

    /**
     * {@link Route} associated with this {@link Segment}.
     */
    readonly route: Route<S>;

  }

  /**
   * Interface describing the shape of a **State** of the {@link Router}.
   * **State**s correspond to the {@link History}, as each navigation results in
   * a new **State** being created. Each {@link Router.navigate}d **State** is
   * represented by its absolute {@link path} its {@link search} parameters and
   * a {@link segment} as entrypoint to the graph-like representation of the
   * {@link Router.navigate}d path through the route-tree.
   *
   * @typeParam S - The {@link Route} path string type.
   */
  export interface State<S extends string = string> {

    /**
     * Absolute **path** of the {@link State}.
     */
    readonly path: S;

    /**
     * **search** parameters of the {@link State}.
     */
    readonly search: string;

    /**
     * {@link Segment} of the {@link State}.
     */
    readonly segment: Segment<S>;

  }

}

/**
 * {@link Target}ed {@link Singleton} **Router** class extending the built-in
 * {@link Set}. This {@link Singleton} class provides routing and rendering
 * capabilities. Routing is primarily realized by maintaining the inherited
 * {@link Set} of {@link Route}s and (recursively) {@link match}ing paths
 * against those {@link Route}s, when instructed so by the {@link navigate}
 * method. When a matching {@link Segment} is found, the corresponding
 * {@link Component}s are rendered by the {@link handle} method (which is part
 * of the implemented {@link Queue} contract).
 *
 * @decorator {@link Target}
 * @decorator {@link Singleton}
 */
@Target()
@Singleton()
export class Router extends Set<Route> implements Router.Queue {

  /**
   * Private static {@link ReplaySubject} used as the {@link Router} **loader**.
   * This **loader** emits every time {@link Route}s are {@link add}ed, whilst
   * the {@link size} being `0`, so either for the first time after construction
   * or after the {@link Router} was {@link clear}ed.
   */
  private static loader: ReplaySubject<Router>;

  /**
   * Static `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} mirrors the private {@link loader} and is
   * used for initializations after a new global {@link Route} tree was
   * {@link add}ed to the {@link Router}.
   *
   * @returns A {@link Subscribable} emitting this {@link Router}.
   *
   * @example
   * Subscribe to the {@link Router}:
   * ```ts
   * import { Router } from '@sgrud/shell';
   * import { from } from 'rxjs';
   *
   * from(Router).subscribe(console.log);
   * ```
   */
  public static [Symbol.observable](): Subscribable<Router> {
    return this.loader.asObservable();
  }

  /**
   * Static initialization block.
   */
  static {
    this.loader = new ReplaySubject<Router>(1);
  }

  /**
   * `declare`d well-known `Symbol.iterator` property. This declaration enforces
   * correct typing when retrieving the {@link Subscribable} from the well-known
   * `Symbol.observable` method by voiding the inherited `Symbol.iterator`.
   */
  declare public readonly [Symbol.iterator]: never;

  /**
   * An absolute **baseHref** for navigation.
   *
   * @defaultValue `'/'`
   */
  public readonly baseHref: string;

  /**
   * Wether to employ **hashBased** routing.
   *
   * @defaultValue `false`
   */
  public readonly hashBased: boolean;

  /**
   * The rendering **outlet** for {@link navigate}d {@link Route}s.
   *
   * @defaultValue `document.body`
   */
  public readonly outlet: DocumentFragment | Element;

  /**
   * Internally used {@link BehaviorSubject} containing and emitting every
   * {@link navigate}d {@link State}.
   */
  private readonly changes: BehaviorSubject<Router.State>;

  /**
   * Getter mirroring the current value of the internal {@link changes}
   * {@link BehaviorSubject}.
   */
  public get state(): Router.State {
    return this.changes.value;
  }

  /**
   * Public {@link Singleton} {@link Router} class **constructor**. This
   * **constructor** is called once by the {@link Target} decorator and sets
   * initial values on this instance. All subsequent calls will return the
   * previously constructed {@link Singleton} instance of this class.
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
        params: {},
        route: {
          path: ''
        }
      }
    });
  }

  /**
   * Well-known `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} emits the current {@link State} and every
   * time this {@link changes}.
   *
   * @returns A {@link Subscribable} emitting {@link State}s.
   *
   * @example
   * Subscribe to upcoming {@link State}s:
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
   * will **add** the supplied `route` to the {@link Router} after deleting its
   * child {@link Route}s from the {@link Router}, thereby ensuring that only
   * root `route`s remain part of the {@link Router}.
   *
   * @param route - The {@link Route} to **add** to the {@link Router}.
   * @returns This instance of the {@link Router}.
   */
  public override add(route: Route): this {
    if (route.children?.length) {
      for (const child of route.children) {
        this.delete(child);
      }
    }

    if (!this.size) {
      asyncScheduler.schedule(() => {
        Router.loader.next(this);
        Router.loader.complete();
      });
    }

    return super.add(route);
  }

  /**
   * **connect**ing helper method. Calling this method will **connect** a
   * handler to the global `onpopstate` event, invoking {@link navigate} with
   * the appropriate arguments. This method furthermore allows the properties
   * {@link Router.baseHref}, {@link Router.hashBased} and {@link Router.outlet}
   * to be overridden. Invoking the **connect** method throws an error if called
   * more than once, without invoking the {@link disconnect} method in between
   * invocations.
   *
   * @param this - The {@link Mutable} explicit polymorphic `this` parameter.
   * @param outlet - The rendering `outlet` for {@link Route}s.
   * @param baseHref - An absolute `baseHref` for navigation.
   * @param hashBased - Wether to employ `hashBased` routing.
   * @throws A {@link ReferenceError} if already **connect**ed.
   */
  public connect(
    this: Mutable<this>,
    outlet: DocumentFragment | Element = this.outlet,
    baseHref: string = this.baseHref,
    hashBased: boolean = this.hashBased
  ): void {
    if (!TypeOf.window(globalThis.window) || window.onpopstate) {
      throw new ReferenceError('window.onpopstate');
    }

    window.onpopstate = (event) => {
      if (event.state) {
        const { search, segment } = event.state as Router.State;
        this.navigate(segment, search, 'pop').subscribe();
      } else {
        const { hash, pathname, search } = location;
        this.navigate(pathname + hash, search, 'pop').subscribe();
      }
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
   * **disconnect**ing helper method. Calling this method (after calling
   * {@link connect}) will **disconnect** the previously {@link connect}ed
   * handler from the global `onpopstate` event. Further, the arguments passed
   * to {@link connect} are revoked, meaning the default values of the
   * properties {@link baseHref}, {@link hashBased} and {@link outlet} are
   * restored. Calling this method without previously {@link connect}ing the
   * {@link Router} throws an error.
   *
   * @param this - The {@link Mutable} explicit polymorphic `this` parameter.
   * @throws A {@link ReferenceError} if already **disconnect**ed.
   */
  public disconnect(this: Mutable<this>): void {
    if (!TypeOf.window(globalThis.window) || !window.onpopstate) {
      throw new ReferenceError('window.onpopstate');
    }

    this.baseHref = '/';
    this.hashBased = false;
    this.outlet = document.body;

    window.onpopstate = null;
  }

  /**
   * Implementation of the **handle** method as required by the {@link Queue}
   * interface contract. It is called internally by the {@link navigate} method
   * after all {@link Queue}s have been invoked. It is therefore considered the
   * default or fallback {@link Queue} and handles the rendering of the supplied
   * `state`.
   *
   * @param state - The next {@link State} to handle.
   * @param action - The {@link Action} to apply to the {@link History}.
   * @returns An {@link Observable} of the handled {@link State}.
   */
  public handle(
    state: Router.State,
    action: Router.Action = 'push'
  ): Observable<Router.State> {
    return new Observable((observer) => {
      let segment = this.spool(state.segment, false);
      let template = [] as JSX.Element;

      do {
        if (segment.route.component) {
          const params = assign({}, segment.params, { children: template });

          for (const key in segment.route.slots) {
            params.children.unshift(...createElement(segment.route.slots[key], {
              slot: key
            }));
          }

          template = createElement(segment.route.component, params);
        }
      } while (segment = segment.parent!);

      this.changes.next(state);
      render(this.outlet, template);
      this.changes.pipe(first()).subscribe(observer);

      if (action !== 'pop') {
        history[`${action}State`](state, '', this.rebase(state.path));
      }
    });
  }

  /**
   * {@link Segment} **join**ing helper. The supplied `segment` is converted to
   * a string by {@link spool}ing to its top-most parent and iterating through
   * all children while concatenating every encountered path. If said path is an
   * (optional) parameter, this portion of the returned string is replaced by
   * the respective {@link Params} value.
   *
   * @param segment - The {@link Segment} to be **join**ed.
   * @returns The **join**ed {@link Segment} in string form.
   */
  public join(segment: Router.Segment): string {
    const parts = [];
    segment = this.spool(segment);

    do {
      const paths = segment.route.path.split('/');

      for (let path of paths) {
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
   * and optionally an array of `routes` to iterate will return the **lookup**ed
   * {@link Route} path for the supplied `selector` or `undefined`, if it does
   * not occur within at least one route. When multiple occurrences of the same
   * `selector` exist, the {@link Route} path to its first occurrence is
   * returned.
   *
   * @param selector - The {@link Component} `selector` to **lookup**.
   * @param routes - An array of `routes` to use for **lookup**.
   * @returns The **lookup**ed {@link Route} path or `undefined`.
   */
  public lookup(
    selector: string,
    routes: Route[] = Array.from(this)
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
   * Main {@link Router} **match**ing method. Calling this method while
   * supplying a `path` and optionally an array of `routes` will return the
   * first **match**ing {@link Segment} or `undefined`, if nothing **match**es.
   * If no `routes` are supplied, routes previously added to the {@link Router}
   * will be used. The **match** method represents the backbone of this
   * {@link Router} class, as it, given a list of `routes` and a `path`, will
   * determine wether this path represents a **match** within the list of
   * `routes`, thereby effectively determining navigational integrity.
   *
   * @param path - The `path` to **match** `routes` against.
   * @param routes - An array of `routes` to use for **match**ing.
   * @returns The first **match**ing {@link Segment} or `undefined`.
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
        params: {},
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
              [key]: decodeURI(paths[i])
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
   * Main **navigate** method. Calling this method while supplying either a path
   * or {@link Segment} as navigation `target` and optional `search` parameters
   * will normalize the supplied path by trying to {@link match} a respective
   * {@link Segment} or directly use the supplied {@link Segment} for the next
   * {@link State}. This upcoming {@link State} is looped through all linked
   * {@link Queue}s and finally {@link handle}d by the {@link Router} itself to
   * render the resulting, possibly intercepted and mutated {@link State}.
   *
   * @param target - Path or {@link Segment} to **navigate** to.
   * @param search - Optional `search` parameters in string form.
   * @param action - The {@link Action} to apply to the {@link History}.
   * @returns An {@link Observable} of the **navigate**d {@link State}.
   * @throws An {@link Observable} {@link URIError}, if nothing {@link match}es.
   */
  public navigate(
    target: string | Router.Segment,
    search?: string,
    action: Router.Action = 'push'
  ): Observable<Router.State> {
    return defer(() => {
      const prev = this.changes.value;
      const queue = (next: Router.State) => this.handle(next, action);
      const queues = new Linker<typeof Queue>().getAll(Queue);

      if (TypeOf.string(target)) {
        const url = new URL(target, location.origin);
        const { hash, pathname, search: params } = url;
        const match = this.match(this.rebase(pathname + hash, false));

        if (!match) {
          const error = () => new URIError(pathname + hash);
          const handle = () => throwError(error);
          const next = {
            path: pathname + hash,
            search: params,
            segment: {
              params: {},
              route: {
                path: pathname + hash
              }
            }
          };

          return onErrorResumeNext(queues.map((handler) => {
            return handler.handle(prev, next, { handle });
          })).pipe(throwIfEmpty(error));
        }

        target = match;
        search ??= params;
      } else {
        target = this.spool(target);
      }

      return (function handle(next: Router.State): Observable<Router.State> {
        return queues.shift()?.handle(prev, next, { handle }) || queue(next);
      })({
        path: this.join(target),
        search: search ?? '',
        segment: target
      });
    });
  }

  /**
   * **rebase** helper method. **rebase**s the supplied `path` against the
   * current {@link baseHref}, by either `prefix`ing the {@link baseHref} to the
   * supplied `path` or stripping it, depending on the `prefix` argument.
   *
   * @param path - The `path` to **rebase** against the {@link baseHref}.
   * @param prefix - Wether to `prefix` or strip the {@link baseHref}.
   * @returns The `path` **rebase**d against the {@link baseHref}.
   */
  public rebase(path: string, prefix: boolean = true): string {
    if (prefix) {
      if (!path.startsWith(this.baseHref)) {
        return path.replace(/^\/?/, this.baseHref.replace(/\/?$/, '/'));
      }
    } else {
      const paths = path.split('/');
      const parts = this.baseHref.split('/');
      let index = 0;

      while (index < paths.length && paths[index] === parts[index]) index++;
      return paths.slice(index).join('/');
    }

    return path;
  }

  /**
   * **spool**ing helper method. Given a `segment` (and wether to `rewind`), the
   * top-most parent (or deepest child) of the graph-link {@link Segment} is
   * returned.
   *
   * @param segment - The {@link Segment} to **spool**.
   * @param rewind - Wether to `rewind` the **spool** direction.
   * @returns The **spool**ed {@link Segment}.
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

}
