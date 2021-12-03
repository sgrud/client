import { concat, finalize, forkJoin, ignoreElements, last, mapTo, observable, Observable, pluck, Subject, Subscribable, switchMap, throwError } from 'rxjs';
import { HttpClient } from '../http/client';
import { assign } from '../typing/assign';
import { Singleton } from '../utility/singleton';

/**
 * Interface describing the shape of a module. This interface is aligned with
 * some [package.json](https://nodejs.dev/learn/the-package-json-guide) fields.
 * It further specifies an optional {@link sgrudDependencies} mapping, as well
 * as an optional {@link webDependencies} mapping, which both are used by the
 * {@link Kernel} to determine SGRUD module dependencies and runtime (web)
 * dependencies.
 *
 * @example An example module definition.
 * ```ts
 * import type { Module } from '@sgrud/core';
 *
 * const module: Module = {
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
   * ESM module entrypoint.
   */
  readonly exports?: string;

  /**
   * UMD module entrypoint.
   */
  readonly unpkg?: string;

  /**
   * Optional bundle digests. If hashes are supplied, they will be used to
   * verify the [subresource integrity](https://www.w3.org/TR/SRI) of the
   * respective bundles.
   */
  readonly digest?: Record<string, `sha${256 | 384 | 512}-${string}`>;

  /**
   * Optional SGRUD dependencies.
   */
  readonly sgrudDependencies?: Record<string, string>;

  /**
   * Optional runtime dependencies.
   */
  readonly webDependencies?: Record<string, {
    exports?: Record<string, string>;
    unpkg?: string[];
  }>;

}

/**
 * Singleton Kernel class. This Kernel is essentially a dependency loader for
 * ESM bundles (and their respective importmap) or, depending on the browser
 * context, UMD bundles and their transitive dependencies. Using this Kernel,
 * applications based on the SGRUD client library may be comprised of multiple,
 * optionally loaded {@link Module}s, which, depending on the application
 * structure and configuration, can be {@link insmod}ded initially, by supplying
 * their names through the corresponding API endpoint, or later on, manually.
 *
 * @decorator {@link Singleton}
 */
@Singleton<typeof Kernel>()
export class Kernel {

  /**
   * Symbol property typed as callback to a Subscribable. The returned
   * subscribable stream emits all the loaded modules.
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
  public readonly [Symbol.observable]: () => Subscribable<Module>;

  /**
   * Internal mapping of all via importmap defined module identifiers to their
   * corresponding paths. This mapping is used for housekeeping, e.g., to
   * prevent the same module identifier to be defined multiple times.
   */
  private readonly imports: Map<string, string>;

  /**
   * Internal mapping of all via {@link insmod} loaded modules to a
   * corresponding Subject. The Subject tracks the module loading process as
   * such, that it emits the module definition once the respective module is
   * fully (including dependencies etc.) loaded and then completes.
   */
  private readonly loaders: Map<string, Subject<Module>>;

  /**
   * Internal Subject tracking the initial loading state of the Kernel. An
   * Observable from this Subject may be retrieved by subscribing to the
   * Subscribable returned by the `rxjs.observable` interop getter. The Subject
   * (and therefore Observable) emits all module definitions which are initially
   * supplied by their names and completes when all initially supplied models
   * are loaded.
   */
  private readonly loading: Subject<Module>;

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
  public get [observable](): () => Subscribable<Module> {
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
    baseHref: string = location.origin,

    /**
     * The global SGRUD API endpoint. The Kernel will, e.g., request the list of
     * modules to be loaded (by their names) from `${endpoint}/insmod`.
     */
    public readonly endpoint: string = `${baseHref}/api/sgrud/v1`,

    /**
     * The global path to request Nodejs modules from. All JavaScript assets
     * belonging to modules installed via NPM should be located here.
     */
    public readonly nodeModules: string = `${baseHref}/node_modules`

  ) {
    this.imports = new Map<string, string>();
    this.loaders = new Map<string, Subject<Module>>();
    this.loading = new Subject<Module>();
    this.shimmed = '';

    const queried = document.querySelectorAll('script[type^="importmap"]');
    const scripts = Array.from(queried) as HTMLScriptElement[];

    for (const script of scripts) {
      this.shimmed ||= script.type.toLowerCase().replace('importmap', '');

      if (script.type.toLowerCase().startsWith('importmap')) {
        const { imports } = JSON.parse(script.innerHTML);

        if (imports) {
          for (const key in imports) {
            this.imports.set(key, imports[key]);
          }
        }
      }
    }

    HttpClient.get<Module>(`${endpoint}/insmod`).pipe(
      pluck('response'),
      switchMap((response) => this.insmod(response)),
      ignoreElements()
    ).subscribe(this.loading);
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
  public insmod(module: Module): Observable<Module> {
    let loader = this.loaders.get(module.name);

    if (!loader) {
      loader = new Subject<Module>();
      this.loaders.set(module.name, loader);

      const chain = [] as Observable<any>[];
      const dependencies = { } as Required<Module>['webDependencies'][string];
      const { sgrudDependencies, webDependencies } = module;

      if (sgrudDependencies) {
        chain.push(forkJoin(Object.keys(sgrudDependencies).map((name) => {
          return this.resolve(name).pipe(switchMap((dependency) => {
            if (!this.satisfies(dependency.version, sgrudDependencies[name])) {
              return throwError(() => new RangeError(dependency.name));
            }

            return this.insmod(dependency);
          }));
        })));
      }

      for (const name in webDependencies) {
        const { exports, unpkg } = webDependencies[name];

        if (exports) {
          for (const key in exports) {
            const src = `${this.nodeModules}/${name}/${exports[key]}`;

            if (!this.imports.has(key)) {
              this.imports.set(key, (dependencies.exports ??= { })[key] = src);
            }
          }
        }

        if (unpkg) {
          for (const bundle of unpkg) {
            const src = `${this.nodeModules}/${name}/${bundle}`;

            if (!dependencies.unpkg?.includes(src)) {
              (dependencies.unpkg ??= []).push(src);
            }
          }
        }
      }

      if (!('sgrud' in globalThis) && module.exports) {
        if (dependencies.exports) {
          chain.push(this.script({
            innerHTML: JSON.stringify({ imports: dependencies.exports }),
            type: 'importmap' + this.shimmed
          }));
        }

        chain.push(this.script({
          integrity: module.digest?.exports,
          src: `${this.nodeModules}/${module.name}/${module.exports}`,
          type: 'module' + this.shimmed
        }));
      } else if (module.unpkg) {
        if (dependencies.unpkg?.length) {
          chain.push(forkJoin(dependencies.unpkg.map((bundle) => this.script({
            src: bundle,
            type: 'text/javascript'
          }))));
        }

        chain.push(this.script({
          integrity: module.digest?.unpkg,
          src: `${this.nodeModules}/${module.name}/${module.unpkg}`,
          type: 'text/javascript'
        }));
      } else if (this.loaders.size > 1) {
        return throwError(() => ReferenceError(module.name));
      }

      concat(...chain).pipe(last(), mapTo(module), finalize(() => {
        this.loading.next(module);
      })).subscribe(loader);
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
  public resolve(name: string): Observable<Module> {
    const module = `${this.nodeModules}/${name}/package.json`;
    return HttpClient.get<Module>(module).pipe(pluck('response'));
  }

  /**
   * Inserts a HTML script element and applies the supplied `props` to it. The
   * returned Observable emits and completes when the elements onload handler is
   * called. When no external resource is supplied through `props.src`, the
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
   *   src: '/node_modules/module/index.esm.js',
   *   type: 'module'
   * }).subscribe(console.log);
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

      if (!props.src || (
        this.shimmed && props.type?.endsWith(this.shimmed)
      )) {
        setTimeout(script.onload);
      }

      document.head.appendChild(script);
      return () => script.remove();
    });
  }

  /**
   * Best-effort [semver](https://semver.org) matcher. The supplied `version`
   * will be tested against all supplied `ranges`.
   *
   * @param semver - Tested semantic version string.
   * @param ranges - Ranges to test the `version` against.
   * @returns Wether `semver` satisfies `ranges`.
   *
   * @example Test `'1.2.3'` against `'>2 <1 || ~1.2.*'`.
   * ```ts
   * import { Kernel } from '@sgrud/core';
   *
   * new Kernel().satisfies('1.2.3', '>2 <1 || ~1.2.*'); // true
   * ```
   */
  public satisfies(semver: string, ranges: string): boolean {
    const input = semver.replace(/\+.*$/, '').split(/[-.]/);
    const paths = ranges.split(/\s*\|\|\s*/);

    for (const path of paths) {
      const parts = path.split(/\s+/);
      let tests = [] as [string, string[]][];
      let valid = true;

      for (let part of parts) {
        let mode = '=';
        part = part.replace(/^[<>=~^]*/, (match) => {
          if (match) mode = match;
          return '';
        }).replace(/^V|\.[X*]/gi, '');

        if (/^[X~*^]*$/i.exec(part)) {
          tests = [['>=', ['0', '0', '0', '0']]];
          break;
        }

        let index;
        const split = part.replace(/\+.*$/, '').split(/[-.]/);

        if (mode === '^') {
          index = Math.min(split.lastIndexOf('0') + 1, split.length - 1, 2);
        } else if (mode === '~' || mode === '~>') {
          index = Math.min(split.length - 1, 1);
        } else {
          tests.push([mode, split]);
          continue;
        }

        const empty = new Array(split.length - index).fill(0);
        const match = split.slice(0, index + 1).concat(...empty);
        match[index] = (parseInt(match[index]) + 1).toString();
        tests.push(['>=', split], ['<', match]);
      }

      for (const [mode, taken] of tests) {
        const latest = input.some((i) => /[^\d]+/.exec(i));
        const length = Math.min(input.length, taken.length);
        const source = input.slice(0, length).join('.');
        const target = taken.slice(0, length).join('.');
        const weight = source.localeCompare(target, undefined, {
          numeric: true,
          sensitivity: 'base'
        });

        valid &&= (!latest || length === input.length);

        switch (mode) {
          case '<': valid &&= weight < 0; break;
          case '<=': valid &&= weight <= 0; break;
          case '>': valid &&= weight > 0; break;
          case '>=': valid &&= weight >= 0; break;
          case '=': valid &&= weight === 0; break;
          default: valid = false; break;
        }

        if (!valid) {
          break;
        }
      }

      if (valid) {
        return true;
      }
    }

    return false;
  }

}
