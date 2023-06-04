import { asyncScheduler, concat, defaultIfEmpty, defer, forkJoin, ignoreElements, map, Observable, of, ReplaySubject, Subscribable, switchMap, throwError } from 'rxjs';
import { Http } from '../http/http';
import { Alias } from '../typing/alias';
import { Mutable } from '../typing/mutable';
import { assign } from '../utility/assign';
import { Singleton } from '../utility/singleton';
import { Symbol } from '../utility/symbols';
import { semver } from './semver';

/**
 * The **Kernel** namespace contains types and interfaces used and intended to
 * be used in conjunction with the {@link Singleton} {@link Kernel} class.
 *
 * @see {@link Kernel}
 */
export namespace Kernel {

  /**
   * String literal helper type. Enforces any assigned string to represent a
   * browser-parsable **Digest** hash. A **Digest** hash is used to represent a
   * hash for [Subresource Integrity](https://www.w3.org/TR/SRI) validation.
   *
   * @example
   * A valid **Digest**:
   * ```ts
   * import { type Kernel } from '@sgrud/core';
   *
   * const digest: Kernel.Digest = 'sha256-[...]';
   * ```
   */
  export type Digest = Alias<`sha${256 | 384 | 512}-${string}`>;

  /**
   * Interface describing the shape of a **Module** while being aligned with
   * well-known `package.json` fields. This interface additionally specifies
   * optional `sgrudDependencies` and `webDependencies` mappings, which both are
   * used by the {@link Kernel} to determine [SGRUD](https://sgrud.github.io)
   * module dependencies and runtime dependencies.
   *
   * @example
   * An exemplary **Module** definition:
   * ```ts
   * import { type Kernel } from '@sgrud/core';
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
     * The **name** of the {@link Module}.
     */
    readonly name: string;

    /**
     * The {@link Module} version, formatted as according to the
     * [semver](https://semver.org) specifications.
     */
    readonly version: string;

    /**
     * Optional ESM entry point.
     */
    readonly exports?: string;

    /**
     * Optional UMD entry point.
     */
    readonly unpkg?: string;

    /**
     * Optional bundle {@link Digest}s. If hashes are supplied, they will be
     * used to verify the [Subresource Integrity](https://www.w3.org/TR/SRI) of
     * the respective bundles.
     */
    readonly digest?: Record<string, Digest>;

    /**
     * Optional [SGRUD](https://sgrud.github.io) {@link Module} dependencies.
     */
    readonly sgrudDependencies?: Record<string, string>;

    /**
     * Optional {@link WebDependency} mapping.
     */
    readonly webDependencies?: Record<string, WebDependency>;

  }

  /**
   * Interface describing runtime dependencies of a {@link Module}. A
   * {@link Module} may specify an array of UMD bundles to be loaded by the
   * {@link Kernel} through the `unpkg` property. A {@link Module} may also
   * specify a mapping of `import` specifiers to {@link Module}-relative paths
   * through the `exports` property. Every specified **WebDependency** is loaded
   * before respective bundles of the {@link Module}, which depends on the
   * specified **WebDependency**, will be loaded themselves.
   *
   * @example
   * An exemplary **webDependency** definition:
   * ```ts
   * import { type Kernel } from '@sgrud/core';
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
 * {@link Singleton} **Kernel** class. The **Kernel** is essentially a
 * dependency loader for ESM bundles (and their respective `importmap`s) or,
 * depending on the runtime context and capabilities, UMD bundles and their
 * transitive dependencies. By making use of the **Kernel**, applications based
 * on the [SGRUD](https://sgrud.github.io) client libraries may be comprised of
 * multiple, optionally loaded {@link Kernel.Module}s.
 *
 * @decorator {@link Singleton}
 */
@Singleton()
export class Kernel {

  /**
   * Internal {@link ReplaySubject} tracking the loading state and therefore
   * **changes** of loaded {@link Kernel.Module}s. An {@link Observable} form of
   * this internal {@link ReplaySubject} may be retrieved by invoking the
   * well-known `Symbol.observable` method and subscribing to the returned
   * {@link Subscribable}. The internal **changes** {@link ReplaySubject} emits
   * all {@link Kernel.Module} definitions loaded throughout the lifespan of
   * this class.
   */
  private readonly changes: ReplaySubject<Kernel.Module>;

  /**
   * Internal {@link Map}ping to keep track of all via `importmap`s declared
   * {@link Kernel.Module} identifiers to their corresponding paths. This map is
   * used for housekeeping, e.g., to prevent the same {@link Kernel.Module}
   * identifier to be defined multiple times.
   */
  private readonly imports: Map<string, string>;

  /**
   * Internal {@link Map}ping of all {@link Kernel.Module}s **loaders** to a
   * {@link ReplaySubject}. This {@link ReplaySubject} tracks the loading
   * process as such, that it emits the {@link Kernel.Module} definition once
   * the respective {@link Kernel.Module} is fully loaded (including
   * dependencies etc.) and then completes.
   */
  private readonly loaders: Map<string, ReplaySubject<Kernel.Module>>;

  /**
   * Internally used string to suffix the `importmap` and `module` types of
   * {@link HTMLScriptElement}s with, if applicable. This string is set to
   * whatever trails the type of {@link HTMLScriptElement}s encountered upon
   * initialization, iff their type starts with `importmap`.
   */
  private readonly shimmed: string;

  /**
   * {@link Singleton} **constructor**. The first time, this **constructor** is
   * called, it will persist the {@link nodeModules} path {@link Kernel.Module}s
   * should be loaded from. Subsequent **constructor** calls will ignore this
   * argument and return the {@link Singleton} instance. Through subscribing to
   * the {@link Subscribable} returned by the well-known `Symbol.observable`
   * method, the {@link Kernel.Module} loading progress can be tracked.
   *
   * @param nodeModules - Optional location to load node modules from.
   *
   * @example
   * Instantiate the **Kernel** and require {@link Kernel.Module}s:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   * import { forkJoin } from 'rxjs';
   *
   * const kernel = new Kernel('https://unpkg.com');
   *
   * forkJoin([
   *   kernel.require('example-module'),
   *   kernel.require('/static/local-module')
   * ]).subscribe(console.log);
   * ```
   */
  public constructor(

    /**
     * Optional location to load node modules from.
     *
     * @defaultValue `'/node_modules'`
     */
    public readonly nodeModules: string = '/node_modules'

  ) {
    this.changes = new ReplaySubject<Kernel.Module>();
    this.imports = new Map<string, string>();
    this.loaders = new Map<string, ReplaySubject<Kernel.Module>>();
    this.shimmed = '';

    const queried = document.querySelectorAll('script[type^="importmap"]');
    const scripts = Array.from(queried as NodeListOf<HTMLScriptElement>);

    for (const script of scripts) {
      this.shimmed ||= script.type.replace('importmap', '');
      const { imports } = JSON.parse(script.innerHTML);

      for (const key in imports) {
        this.imports.set(key, imports[key]);
      }
    }
  }

  /**
   * Well-known `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} emits every {@link Kernel.Module} that is
   * successfully loaded.
   *
   * @returns A {@link Subscribable} emitting loaded {@link Kernel.Module}s.
   *
   * @example
   * Subscribe to the loaded {@link Kernel.Module}s:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   * import { from } from 'rxjs';
   *
   * from(new Kernel()).subscribe(console.log);
   * ```
   */
  public [Symbol.observable](): Subscribable<Kernel.Module> {
    return this.changes.asObservable();
  }

  /**
   * Calling this method while supplying a valid `module` definition will chain
   * the **ins**ert **mod**ule operations of the `module` dependencies and the
   * `module` itself into an {@link Observable}, which is then returned. When
   * multiple {@link Kernel.Module}s are inserted, their dependencies are
   * deduplicated by internally tracking all {@link Kernel.Module}s and their
   * transitive dependencies as separate {@link loaders}. Depending on the
   * browser context, either the UMD or ESM bundles (and their respective
   * `importmap`s) are loaded via calling the {@link script} method. When
   * **insmod**ding {@link Kernel.Module}s which contain transitive
   * {@link Kernel.Module.sgrudDependencies}, their compatibility is checked.
   * Should a dependency version mismatch, the {@link Observable} returned by
   * this method will throw.
   *
   * @param module - The {@link Kernel.Module} definition to **insmod**.
   * @param source - An optional {@link Kernel.Module} `source`.
   * @param execute - Whether to `execute` the {@link Kernel.Module}.
   * @returns An {@link Observable} of the {@link Kernel.Module} definition.
   * @throws An {@link Observable} {@link RangeError} or {@link ReferenceError}.
   *
   * @example
   * **insmod** a {@link Kernel.Module} by definition:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   * import packageJson from './module/package.json';
   *
   * new Kernel().insmod(packageJson).subscribe(console.log);
   * ```
   */
  public insmod(
    module: Kernel.Module,
    source: string = `${this.nodeModules}/${module.name}`,
    execute: boolean = false
  ): Observable<Kernel.Module> {
    return defer(() => {
      let loader = this.loaders.get(module.name);

      if (!loader) {
        loader = new ReplaySubject<Kernel.Module>(1);
        this.loaders.set(module.name, loader);

        const chain = [] as Observable<unknown>[];
        const dependencies = {} as Mutable<Kernel.WebDependency>;

        if (module.sgrudDependencies) {
          const entries = Object.entries(module.sgrudDependencies);

          chain.push(forkJoin(entries.map(([name, version]) => {
            const path = /^([./]|https?:)/.test(version) ? version : undefined;

            return this.resolve(name, path).pipe(switchMap((dependency) => {
              if (!path && !semver(dependency.version, version)) {
                return throwError(() => new RangeError(dependency.name));
              }

              execute &&= !module.exports && !module.unpkg;
              return this.insmod(dependency, path, execute);
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
                this.imports.set(key, (dependencies.exports ||= {})[key] = src);
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
          chain.push(this.verify({
            href: `${source}/${module.exports}`,
            integrity: module.digest?.exports || '',
            rel: 'modulepreload' + this.shimmed
          }));

          if (dependencies.exports) {
            chain.push(this.script({
              innerHTML: JSON.stringify({ imports: dependencies.exports }),
              type: 'importmap' + this.shimmed
            }));
          }

          if (execute) {
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
          this.changes.next(module);
        });
      }

      return loader;
    });
  }

  /**
   * **require**s a {@link Kernel.Module} by name or source. If the supplied
   * `id` is a relative path starting with `./`, an absolute path starting with
   * `/` or an URL starting with `http`, the `id` is used as-is, otherwise it is
   * appended to the {@link nodeModules} path and the `package.json` file within
   * this path is retrieved via {@link Http} GET. The {@link Kernel.Module}
   * definition is then passed to the {@link insmod} method and returned.
   *
   * @param id - The {@link Kernel.Module} name or source to **require**.
   * @param execute - Whether to `execute` the {@link Kernel.Module}.
   * @returns An {@link Observable} of the {@link Kernel.Module} definition.
   *
   * @example
   * **require** a {@link Kernel.Module} by `id`:
   * ```ts
   * import { Kernel } from '@sgrud/core';
   *
   * new Kernel().require('/static/lazy-module').subscribe(console.log);
   * ```
   */
  public require(
    id: string,
    execute: boolean = true
  ): Observable<Kernel.Module> {
    if (/^([./]|https?:)/.test(id)) {
      return Http.get<Kernel.Module>(`${id}/package.json`).pipe(
        switchMap((next) => this.insmod(next.response, id, execute))
      );
    }

    return this.resolve(id).pipe(
      switchMap((module) => this.insmod(module, undefined, execute))
    );
  }

  /**
   * **resolve**s a {@link Kernel.Module} definition by its `name`. The
   * {@link Kernel.Module} `name` is appended to the `source` path or, of none
   * is supplied, the {@link nodeModules} path and the `package.json` file
   * therein retrieved via {@link Http} GET. The parsed `package.json` is then
   * emitted by the returned {@link Observable}.
   *
   * @param name - The {@link Kernel.Module} `name` to **resolve**.
   * @param source - An optional {@link Kernel.Module} `source`.
   * @returns An {@link Observable} of the {@link Kernel.Module} definition.
   *
   * @example
   * **resolve** a {@link Kernel.Module} definition:
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
    let loader = this.loaders.get(name)?.asObservable();

    if (!loader) {
      loader = Http.get<Kernel.Module>(`${source}/package.json`).pipe(
        map((next) => next.response)
      );
    }

    return loader;
  }

  /**
   * Inserts an {@link HTMLScriptElement} and applies the supplied `props` to
   * it. The returned {@link Observable} emits and completes when the `onload`
   * handler of the {@link HTMLScriptElement} is called. If no external `src` is
   * supplied through the `props`, the `onload` handler of the element is called
   * asynchronously. When the returned {@link Observable} completes, the
   * inserted {@link HTMLScriptElement} is removed.
   *
   * @param props - Any properties to apply to the {@link HTMLScriptElement}.
   * @returns An {@link Observable} of the {@link HTMLScriptElement}s `onload`.
   *
   * @example
   * Insert an {@link HTMLScriptElement}:
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
        onerror: (error: unknown) => {
          observer.error(error);
        },
        onload: () => {
          observer.next();
          observer.complete();
        }
      });

      if (!props.src || this.shimmed && props.type?.endsWith(this.shimmed)) {
        asyncScheduler.schedule(script.onload);
      }

      document.head.appendChild(script);
      return () => script.remove();
    });
  }

  /**
   * Inserts an {@link HTMLLinkElement} and applies the supplied `props` to it.
   * This method is used to **verify** a {@link Kernel.Module} bundle before
   * importing and executing it by **verify**ing its {@link Kernel.Digest}.
   *
   * @param props - Any properties to apply to the {@link HTMLLinkElement}.
   * @returns An {@link Observable} of the appendage and removal of the element.
   *
   * @example
   * **verify** a {@link Kernel.Module} by {@link Kernel.Digest}:
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
