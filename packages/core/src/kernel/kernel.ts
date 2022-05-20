import { concat, defaultIfEmpty, defer, forkJoin, ignoreElements, map, observable, Observable, of, ReplaySubject, Subscribable, switchMap, throwError } from 'rxjs';
import { HttpClient } from '../http/client';
import { Mutable } from '../typing/mutable';
import { assign } from '../utility/assign';
import { Singleton } from '../utility/singleton';
import { semver } from './semver';

/**
 * Namespace containing types and interfaces to be used in conjunction with the
 * singleton {@link Kernel} class.
 *
 * @see {@link Kernel}
 */
export namespace Kernel {

  /**
   * String literal helper type. Enforces any assigned string to adhere to the
   * represent a browser-parsable digest hash.
   */
  export type Digest = `sha${256 | 384 | 512}-${string}`;

  /**
   * Interface describing the shape of a module. This interface is aligned with
   * some [package.json](https://nodejs.dev/learn/the-package-json-guide)
   * fields. It further specifies an optional {@link sgrudDependencies} mapping,
   * as well as an optional {@link webDependencies} mapping, which both are used
   * by the {@link Kernel} to determine SGRUD module dependencies and runtime
   * (web) dependencies.
   *
   * @example An example module definition.
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
   *
   * @see {@link Kernel}
   */
  export interface Module {

    /**
     * Name of the module.
     */
    readonly name: string;

    /**
     * Module version, formatted as [semver](https://semver.org).
     */
    readonly version: string;

    /**
     * ESM module entry point.
     */
    readonly exports?: string;

    /**
     * UMD module entry point.
     */
    readonly unpkg?: string;

    /**
     * Optional bundle digests. If hashes are supplied, they will be used to
     * verify the [subresource integrity](https://www.w3.org/TR/SRI) of the
     * respective bundles.
     *
     * @see {@link Digest}
     */
    readonly digest?: Record<string, Digest>;

    /**
     * Optional SGRUD dependencies.
     */
    readonly sgrudDependencies?: Record<string, string>;

    /**
     * Optional runtime dependencies.
     *
     * @see {@link WebDependency}
     */
    readonly webDependencies?: Record<string, WebDependency>;

  }

  /**
   * Interface describing a runtime dependency of a {@link Module}.
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
 * Singleton Kernel class. This Kernel is essentially a dependency loader for
 * ESM bundles (and their respective importmap) or, depending on the browser
 * context, UMD bundles and their transitive dependencies. Using this Kernel,
 * applications based on the SGRUD client library may be comprised of multiple,
 * optionally loaded {@link Module}s, which, depending on the application
 * structure and configuration, can be {@link insmod}ded initially, by supplying
 * them as sgrudDependencies through the corresponding API endpoint, or later
 * on, manually.
 *
 * @decorator {@link Singleton}
 */
@Singleton<typeof Kernel>()
export class Kernel {

  /**
   * Symbol property typed as callback to a Subscribable. The returned
   * subscribable stream emits all the loaded modules (and never completes).
   *
   * @returns Callback to a Subscribable.
   *
   * @example Subscribe to the stream of loaded modules.
   * ```ts
   * import { Kernel } from '@sgrud/core';
   * import { from } from 'rxjs';
   *
   * from(new Kernel()).subscribe(console.log);
   * ```
   */
  public readonly [Symbol.observable]: () => Subscribable<Kernel.Module>;

  /**
   * Internal mapping of all via importmap defined module identifiers to their
   * corresponding paths. This mapping is used for housekeeping, e.g., to
   * prevent the same module identifier to be defined multiple times.
   */
  private readonly imports: Map<string, string>;

  /**
   * Internal mapping of all {@link insmod}ded modules to a corresponding
   * ReplaySubject. The ReplaySubject tracks the module loading process as such,
   * that it emits the module definition once the respective module is fully
   * loaded (including dependencies etc.) and then completes.
   */
  private readonly loaders: Map<string, ReplaySubject<Kernel.Module>>;

  /**
   * Internal ReplaySubject tracking the loading state of the Kernel modules. An
   * Observable from this ReplaySubject may be retrieved by subscribing to the
   * Subscribable returned by the `rxjs.observable` interop getter. The actual
   * ReplaySubject (and therefore Observable) emits all module definitions which
   * are {@link insmod}ded throughout the lifespan of the Kernel.
   */
  private readonly loading: ReplaySubject<Kernel.Module>;

  /**
   * Internally used string to suffix the `importmap` and `module` types of HTML
   * script elements with, if applicable. This string is set to whatever trails
   * the type of HTML script elements encountered upon initialization, iff their
   * type starts with `importmap`.
   */
  private readonly shimmed: string;

  /**
   * `rxjs.observable` interop getter returning a callback to a Subscribable.
   */
  public get [observable](): () => Subscribable<Kernel.Module> {
    return () => this.loading.asObservable();
  }

  /**
   * Singleton Kernel constructor. The first time, the Kernel is instantiated,
   * it will retrieve the list of modules which should be loaded and then
   * {@link insmod}s all those modules and their transitive dependencies. Every
   * subsequent constructor call will ignore all arguments and return the
   * singleton instance. Through subscribing to the Subscribable returned by the
   * `rxjs.observable` interop getter, the initial loading progress can be
   * tracked.
   *
   * @param baseHref - Base href for building URLs.
   * @param endpoint - Href of the SGRUD API endpoint.
   * @param nodeModules - Href to load node modules from.
   *
   * @example Instantiate the Kernel.
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
     * Base href for building URLs.
     */
    baseHref: string = location.origin,

    /**
     * The global SGRUD API endpoint. The Kernel will, e.g., request the list of
     * modules to be loaded (by their names) from `${endpoint}/insmod`.
     */
    public readonly endpoint: string = baseHref + '/api/sgrud/v1',

    /**
     * The global path to request Nodejs modules from. All JavaScript assets
     * belonging to modules installed via NPM should be located here.
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
      switchMap(({ response }) => this.insmod(response, undefined, true))
    ).subscribe();
  }

  /**
   * Insert modules. Calling this method while supplying a valid `module`
   * definition will chain the `module` dependencies and the `module` itself
   * into an Observable, which is then returned. When multiple `module`s are
   * inserted, their dependencies are deduplicated by internally tracking all
   * `module`s and their transitive dependencies as separate {@link loaders}.
   * Depending on the browser context, either the UMD or ESM bundles (and their
   * respective importmap) are loaded via calling {@link script}. When inserting
   * {@link Module.sgrudDependencies}, their compatibility is checked. Should a
   * dependency version mismatch, the returned Observable will throw a
   * RangeError.
   *
   * @param module - Module definition.
   * @param pathname - Optional module path.
   * @param entryModule - Wether to run the module.
   * @returns Observable of the module loading.
   *
   * @example Insert a module by definition.
   * ```ts
   * import { Kernel } from '@sgrud/core';
   * import packageJson from 'module/package.json';
   *
   * new Kernel().insmod(packageJson).subscribe(console.log);
   * ```
   *
   * @see {@link Module}
   */
  public insmod(
    module: Kernel.Module,
    pathname: string = `${this.nodeModules}/${module.name}`,
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
          const path = /^([./]|http)/.exec(version) ? version : undefined;

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
        const src = `${pathname}/${module.exports}`;

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

      if (!(globalThis as any).sgrud && module.exports) {
        if (dependencies.exports) {
          chain.push(this.script({
            innerHTML: JSON.stringify({ imports: dependencies.exports }),
            type: 'importmap' + this.shimmed
          }));
        }

        chain.push(this.verify({
          href: `${pathname}/${module.exports}`,
          integrity: module.digest?.exports || '',
          rel: 'modulepreload' + this.shimmed
        }));

        if (entryModule) {
          chain.push(defer(() => import(module.name)));
        }
      } else if ((globalThis as any).sgrud && module.unpkg) {
        if (dependencies.unpkg?.length) {
          chain.push(forkJoin(dependencies.unpkg.map((bundle) => this.script({
            src: bundle,
            type: 'text/javascript'
          }))));
        }

        chain.push(this.script({
          integrity: module.digest?.unpkg || '',
          src: `${pathname}/${module.unpkg}`,
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
   * Retrieves a module definition by module `name`. The module `name` is
   * appended to the node module path and the package.json file therein
   * retrieved via HTTP GET. The parsed package.json is then emitted by the
   * returned Observable.
   *
   * @param name - Module name.
   * @param pathname - Optional module path.
   * @returns Observable of the module definition.
   *
   * @example Resolve a module definition by name.
   * ```ts
   * import { Kernel } from '@sgrud/core';
   *
   * new Kernel().resolve('module').subscribe(console.log);
   * ```
   *
   * @see {@link Module}
   */
  public resolve(
    name: string,
    pathname: string = `${this.nodeModules}/${name}`
  ): Observable<Kernel.Module> {
    if (this.loaders.has(name)) {
      return this.loaders.get(name)!;
    }

    return HttpClient.get<Kernel.Module>(`${pathname}/package.json`).pipe(
      map(({ response }) => response)
    );
  }

  /**
   * Inserts a HTML script element and applies the supplied `props` to it. The
   * returned Observable emits and completes when the element's onload handler
   * is called. When no external resource is supplied through `props.src`, the
   * onload handler is asynchronously called. When the returned Observable
   * completes, the inserted HTML script element is removed.
   *
   * @param props - Script element properties.
   * @returns Observable of the script loading.
   *
   * @example Insert a HTML script element.
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
   * Inserts a HTML link element and applies the supplied `props` to it. This
   * method should be used to verify a module before importing and evaluating
   * it, by providing its [subresource integrity](https://www.w3.org/TR/SRI).
   *
   * @param props - Link element properties.
   * @returns Deferred link appendage and removal.
   *
   * @example Insert a HTML link element.
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
