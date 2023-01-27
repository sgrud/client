import { concat, defaultIfEmpty, defer, forkJoin, ignoreElements, map, Observable, of, ReplaySubject, Subscribable, switchMap, throwError } from 'rxjs';
import { HttpClient } from '../http/client';
import { Mutable } from '../typing/mutable';
import { assign } from '../utility/assign';
import { Singleton } from '../utility/singleton';
import { Symbol } from '../utility/symbols';
import { semver } from './semver';

/**
 * **Kernel** namespace containing types and interfaces used and intended to be
 * used in conjunction with the [Singleton][] [Kernel][] class.
 *
 * [Kernel]: https://sgrud.github.io/client/classes/core.Kernel
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @see [Kernel][]
 */
export namespace Kernel {

  /**
   * String literal helper type. Enforces any assigned string to represent a
   * browser-parsable **Digest** hash.
   *
   * @example
   * A valid **Digest**:
   * ```ts
   * import type { Digest } from '@sgrud/core';
   *
   * const digest: Digest = 'sha256-[...]';
   * ```
   */
  export type Digest = `sha${256 | 384 | 512}-${string}`;

  /**
   * Interface describing the shape of a **Module** while being aligned with
   * well-known [package.json][] fields. This interface additionally specifies
   * optional `sgrudDependencies` and `webDependencies` mappings, which both are
   * used by the [Kernel][] to determine [SGRUD][] module dependencies and
   * runtime (web) dependencies.
   *
   * [Kernel]: https://sgrud.github.io/client/classes/core.Kernel
   * [package.json]: https://docs.npmjs.com/cli/configuring-npm/package-json
   * [SGRUD]: https://sgrud.github.io
   *
   * @example
   * An exemplary **Module** definition:
   * ```ts
   * import type { Kernel } from '@sgrud/core';
   *
   * const module: Kernel.Module = {
   *   name: 'module',
   *   version: '0.0.0',
   *   exports: './module.exports.js',
   *   unpkg: './module.unpkg.js',
   *   sgrudDependencies: {
   *     sgrudDependency: '^0.0.1'
   *   },
   *   webDependencies: {
   *     webDependency: {
   *       exports: {
   *         webDependency: './webDependency.exports.js'
   *       },
   *       unpkg: [
   *         './webDependency.unpkg.js'
   *       ]
   *     }
   *   }
   * };
   * ```
   */
  export interface Module {

    /**
     * Name of the **Module**.
     */
    readonly name: string;

    /**
     * **Module** version, formatted as [semver][].
     *
     * [semver]: https://semver.org
     */
    readonly version: string;

    /**
     * ESM entry point.
     */
    readonly exports?: string;

    /**
     * UMD entry point.
     */
    readonly unpkg?: string;

    /**
     * Optional bundle [Digest][]s. If hashes are supplied, they will be used to
     * verify the [Subresource Integrity][] of the respective bundles.
     *
     * [Digest]: https://sgrud.github.io/client/types/core.Kernel-1.Digest
     * [Subresource Integrity]: https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity
     */
    readonly digest?: Record<string, Digest>;

    /**
     * Optional [SGRUD][] dependencies.
     *
     * [SGRUD]: https://sgrud.github.io
     */
    readonly sgrudDependencies?: Record<string, string>;

    /**
     * Optional [WebDependency][] mapping.
     *
     * [WebDependency]: https://sgrud.github.io/client/interfaces/core.Kernel-1.WebDependency
     */
    readonly webDependencies?: Record<string, WebDependency>;

  }

  /**
   * Interface describing runtime dependencies of a [Module][]. A [Module][] may
   * specify an array of UMD bundles to be loaded by the [Kernel][] through the
   * `unpkg` property. A [Module][] may also specify a mapping of [import][]
   * specifiers to [Module][]-relative paths through the `exports` property.
   * Every specified **WebDependency** is loaded before respective bundles of
   * the [Module][], which depends on the specified **WebDependency**, will be
   * loaded themselves.
   *
   * [import]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/import
   * [Kernel]: https://sgrud.github.io/client/classes/core.Kernel
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   *
   * @example
   * An exemplary **webDependency** definition:
   * ```ts
   * import type { Kernel } from '@sgrud/core';
   *
   * const webDependency: Kernel.WebDependency = {
   *   exports: {
   *     webDependency: './webDependency.exports.js'
   *   },
   *   unpkg: [
   *     './webDependency.unpkg.js'
   *   ]
   * };
   * ```
   */
  export interface WebDependency {

    /**
     * Optional ESM runtime dependencies.
     */
    readonly exports?: Record<string, string>;

    /**
     * Optional UMD runtime dependencies.
     */
    readonly unpkg?: string[];

  }

}

/**
 * [Singleton][] **Kernel** class. The **Kernel** is essentially a dependency
 * loader for ESM bundles (and their respective `importmap`s) or, depending on
 * the runtime context and capabilities, UMD bundles and their transitive
 * dependencies. By making use of the **Kernel**, applications based on the
 * [SGRUD][] client libraries may be comprised of multiple, optionally loaded
 * [Module][]s, which, depending on the application structure and configuration,
 * can be loaded initially, by supplying them as dependencies through the
 * corresponding API endpoint (which can be customized through the second
 * parameter to the *constructor*), or later on, manually.
 *
 * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
 * [SGRUD]: https://sgrud.github.io
 * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
 *
 * @decorator [Singleton][]
 *
 * @see [Module][]
 */
@Singleton<typeof Kernel>()
export class Kernel {

  /**
   * Internal mapping of all via `importmap`s defined [Module][] identifiers to
   * their corresponding paths. This mapping is used for housekeeping, e.g., to
   * prevent the same [Module][] identifier to be defined multiple times.
   *
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   */
  private readonly imports: Map<string, string>;

  /**
   * Internal mapping of all [Module][]s **loaders** to a [ReplaySubject][].
   * This [ReplaySubject][] tracks the [Module][] loading process as such, that
   * it emits the [Module][] definition once the respective [Module][] is fully
   * loaded (including dependencies etc.) and then completes.
   *
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   * [ReplaySubject]: https://rxjs.dev/api/index/class/ReplaySubject
   */
  private readonly loaders: Map<string, ReplaySubject<Kernel.Module>>;

  /**
   * Internal [ReplaySubject][] tracking the **loading** state of [Module][]s.
   * An [Observable][] form of this [ReplaySubject][] may be retrieved by
   * subscribing to the [Subscribable][] returned by the interop getter. The
   * internal [ReplaySubject][] (and the retrievable [Observable][]) emits all
   * [Module][] definitions loaded throughout the lifespan of this class.
   *
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [ReplaySubject]: https://rxjs.dev/api/index/class/ReplaySubject
   * [Subscribable]: https://rxjs.dev/api/index/interface/Subscribable
   */
  private readonly loading: ReplaySubject<Kernel.Module>;

  /**
   * Internally used string to suffix the `importmap` and `module` types of
   * [HTMLScriptElement][]s with, if applicable. This string is set to whatever
   * trails the type of [HTMLScriptElement][]s encountered upon initialization,
   * iff their type starts with `importmap`.
   *
   * [HTMLScriptElement]: https://developer.mozilla.org/docs/Web/API/HTMLScriptElement
   */
  private readonly shimmed: string;

  /**
   * [Singleton][] **constructor**. The first time, this **constructor** is
   * called, it will retrieve the list of modules which should be loaded and
   * then call *insmod* on all those modules and their transitive dependencies.
   * Every subsequent **constructor** call will ignore all arguments and return
   * the [Singleton][] instance. Through subscribing to the [Subscribable][]
   * returned by the [observable][] interop getter, the initial [Module][]
   * loading progress can be tracked.
   *
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   * [observable]: https://rxjs.dev/api/index/const/observable
   * [SGRUD]: https://sgrud.github.io
   * [Singleton]: https://sgrud.github.io/client/functions/core.Singleton
   * [Subscribable]: https://rxjs.dev/api/index/interface/Subscribable
   *
   * @param baseHref - Base href for building URLs.
   * @param endpoint - Href of the [SGRUD][] API endpoint.
   * @param nodeModules - Href to load node modules from.
   *
   * @example
   * Instantiate the **Kernel**:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   *
   * const kernel = new Kernel(
   *   'https://example.com',
   *   '/context/api/sgrud',
   *   'https://unpkg.com'
   * );
   * ```
   */
  public constructor(

    /**
     * Base href for building, e.g., the *endpoint* and *nodeModule* URLs.
     *
     * @defaultValue `location.origin`
     */
    public readonly baseHref: string = location.origin,

    /**
     * Href of the [SGRUD][] API **endpoint**. [Module][]s to be initially
     * loaded (by their names) are requested from the URL `${endpoint}/insmod`
     * when this class is constructed for the first time.
     *
     * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
     * [SGRUD]: https://sgrud.github.io
     *
     * @defaultValue `baseHref + '/api/sgrud/v1'`
     */
    public readonly endpoint: string = baseHref + '/api/sgrud/v1',

    /**
     * Href to load node modules from. All JavaScript assets belonging to
     * packages installed via NPM should be located here.
     *
     * @defaultValue `baseHref + '/node_modules'`
     */
    public readonly nodeModules: string = baseHref + '/node_modules'

  ) {
    this.imports = new Map<string, string>();
    this.loaders = new Map<string, ReplaySubject<Kernel.Module>>();
    this.loading = new ReplaySubject<Kernel.Module>();
    this.shimmed = '';

    const queried = document.querySelectorAll('script[type^="importmap"]');
    const scripts = Array.from(queried) as HTMLScriptElement[];

    for (const script of scripts) {
      this.shimmed ||= script.type.replace('importmap', '');
      const { imports } = JSON.parse(script.innerHTML);

      for (const key in imports) {
        this.imports.set(key, imports[key]);
      }
    }

    HttpClient.get<Kernel.Module>(`${endpoint}/insmod`).pipe(
      switchMap((next) => this.insmod(next.response, undefined, true))
    ).subscribe();
  }

  /**
   * Well-known `Symbol.observable` method returning a [Subscribable][]. The
   * returned [Subscribable][] emits every [Module][] that is successfully
   * loaded.
   *
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   * [Subscribable]: https://rxjs.dev/api/index/interface/Subscribable
   *
   * @returns [Subscribable][] emitting loaded [Module][]s.
   *
   * @example
   * Subscribe to the stream of loaded [Module][]s:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   * import { from } from 'rxjs';
   *
   * from(new Kernel()).subscribe(console.log);
   * ```
   */
  public [Symbol.observable](): Subscribable<Kernel.Module> {
    return this.loading.asObservable();
  }

  /**
   * Insert modules. Calling this method while supplying a valid `module`
   * definition will chain the `module` dependencies and the `module` itself
   * into an [Observable][], which is then returned. When multiple `module`s are
   * inserted, their dependencies are deduplicated by internally tracking all
   * `module`s and their transitive dependencies as separate *loaders*.
   * Depending on the browser context, either the UMD or ESM bundles (and their
   * respective `importmap`s) are loaded via calling the *script* method. When
   * inserting [Module][]s which contain transitive *sgrudDependencies*, their
   * compatibility is checked. Should a dependency version mismatch, the
   * returned [Observable][] will throw.
   *
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param module - [Module][] definition.
   * @param source - Optional [Module][] source.
   * @param entryModule - Wether to run the [Module][].
   * @returns [Observable][] of the [Module][] loading.
   * @throws [Observable][] of a RangeError or ReferenceError.
   *
   * @example
   * Insert a module by definition:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   * import packageJson from 'module/package.json';
   *
   * new Kernel().insmod(packageJson).subscribe(console.log);
   * ```
   */
  public insmod(
    module: Kernel.Module,
    source: string = `${this.nodeModules}/${module.name}`,
    entryModule: boolean = false
  ): Observable<Kernel.Module> {
    let loader = this.loaders.get(module.name);

    if (!loader) {
      loader = new ReplaySubject<Kernel.Module>(1);
      this.loaders.set(module.name, loader);

      const chain = [] as Observable<any>[];
      const dependencies = { } as Mutable<Kernel.WebDependency>;

      if (module.sgrudDependencies) {
        const entries = Object.entries(module.sgrudDependencies);

        chain.push(forkJoin(entries.map(([name, version]) => {
          const path = /^([./]|http)/.test(version) ? version : undefined;

          return this.resolve(name, path).pipe(switchMap((dependency) => {
            if (!path && !semver(dependency.version, version)) {
              return throwError(() => new RangeError(dependency.name));
            }

            entryModule &&= !module.exports && !module.unpkg;
            return this.insmod(dependency, path, entryModule);
          }));
        })));
      }

      if (module.exports && !this.imports.has(module.name)) {
        const src = `${source}/${module.exports}`;

        dependencies.exports = { [module.name]: src };
        this.imports.set(module.name, src);
      }

      for (const name in module.webDependencies) {
        const { exports, unpkg } = module.webDependencies[name];

        if (exports) {
          for (const key in exports) {
            const src = `${this.nodeModules}/${name}/${exports[key]}`;

            if (!this.imports.has(key)) {
              this.imports.set(key, (dependencies.exports ||= { })[key] = src);
            }
          }
        }

        if (unpkg) {
          for (const bundle of unpkg) {
            const src = `${this.nodeModules}/${name}/${bundle}`;

            if (!dependencies.unpkg?.includes(src)) {
              (dependencies.unpkg ||= []).push(src);
            }
          }
        }
      }

      if (!globalThis.sgrud && module.exports) {
        if (dependencies.exports) {
          chain.push(this.script({
            innerHTML: JSON.stringify({ imports: dependencies.exports }),
            type: 'importmap' + this.shimmed
          }));
        }

        chain.push(this.verify({
          href: `${source}/${module.exports}`,
          integrity: module.digest?.exports || '',
          rel: 'modulepreload' + this.shimmed
        }));

        if (entryModule) {
          chain.push(defer(() => import(module.name)));
        }
      } else if (globalThis.sgrud && module.unpkg) {
        if (dependencies.unpkg?.length) {
          chain.push(forkJoin(dependencies.unpkg.map((bundle) => this.script({
            src: bundle,
            type: 'text/javascript'
          }))));
        }

        chain.push(this.script({
          integrity: module.digest?.unpkg || '',
          src: `${source}/${module.unpkg}`,
          type: 'text/javascript'
        }));
      } else if (this.loaders.size > 1) {
        return throwError(() => ReferenceError(module.name));
      }

      concat(...chain).pipe(
        ignoreElements(),
        defaultIfEmpty(module)
      ).subscribe(loader).add(() => {
        this.loading.next(module);
      });
    }

    return loader;
  }

  /**
   * **Resolve**s a [Module][] definition by its `name`. The [Module][] `name`
   * is appended to the *nodeModules* path and the [package.json][] file therein
   * retrieved via HTTP GET. The parsed [package.json][] is then emitted by the
   * returned [Observable][].
   *
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [package.json]: https://docs.npmjs.com/cli/configuring-npm/package-json
   *
   * @param name - [Module][] name.
   * @param source - Optional [Module][] source.
   * @returns [Observable][] of the [Module][] definition.
   *
   * @example
   * Resolve a [Module][] definition:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   *
   * new Kernel().resolve('module').subscribe(console.log);
   * ```
   */
  public resolve(
    name: string,
    source: string = `${this.nodeModules}/${name}`
  ): Observable<Kernel.Module> {
    const loader = this.loaders.get(name);

    if (loader) {
      return loader;
    }

    return HttpClient.get<Kernel.Module>(`${source}/package.json`).pipe(
      map((next) => next.response)
    );
  }

  /**
   * Inserts an [HTMLScriptElement][] and applies the supplied `props` to it.
   * The returned [Observable][] emits and completes when the *onload* handler
   * is called on the [HTMLScriptElement][]. If no external *src* is supplied
   * through the `props`, the *onload* handler is called asynchronously. When
   * the returned [Observable][] completes, the inserted [HTMLScriptElement][]
   * is removed.
   *
   * [HTMLScriptElement]: https://developer.mozilla.org/docs/Web/API/HTMLScriptElement
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param props - [HTMLScriptElement][] properties.
   * @returns [Observable][] of the [HTMLScriptElement][]s load and removal.
   *
   * @example
   * Insert an [HTMLScriptElement][]:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   *
   * new Kernel().script({
   *   src: '/node_modules/module/bundle.js',
   *   type: 'text/javascript'
   * }).subscribe();
   * ```
   */
  public script(props: Partial<HTMLScriptElement>): Observable<void> {
    return new Observable<void>((observer) => {
      const script = assign(document.createElement('script'), props, {
        onerror: (error: any) => {
          observer.error(error);
        },
        onload: () => {
          observer.next();
          observer.complete();
        }
      });

      if (!props.src || this.shimmed && props.type?.endsWith(this.shimmed)) {
        setTimeout(script.onload);
      }

      document.head.appendChild(script);
      return () => script.remove();
    });
  }

  /**
   * Inserts an HTML link element and applies the supplied `props` to it. This
   * method should be used to **verify** a [Module][] bundle before importing
   * and evaluating it, by providing its [Subresource Integrity][].
   *
   * [Module]: https://sgrud.github.io/client/interfaces/core.Kernel-1.Module
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Subresource Integrity]: https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity
   *
   * @param props - Link element properties.
   * @returns [Observable][] of link appendage and removal.
   *
   * @example
   * **Verify** the [Subresource Integrity][]:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   *
   * new Kernel().verify({
   *   href: '/node_modules/module/index.js',
   *   integrity: 'sha256-[...]',
   *   rel: 'modulepreload'
   * }).subscribe();
   * ```
   */
  public verify(props: Partial<HTMLLinkElement>): Observable<void> {
    const link = assign(document.createElement('link'), props);
    return defer(() => of(document.head.appendChild(link).remove()));
  }

}
