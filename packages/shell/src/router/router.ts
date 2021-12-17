import { assign, Singleton } from '@sgrud/core';

/**
 *
 */
export namespace Router {

  /**
   *
   */
  export type Path = `/${string}`;

  /**
   *
   */
  export interface Route<S extends string = string> {

    /**
     *
     */
    readonly children?: Route[];

    /**
     *
     */
    readonly component?: keyof HTMLElementTagNameMap;

    /**
     *
     */
    readonly context?: Record<string, any>;

    /**
     *
     */
    readonly modules?: string[];

    /**
     *
     */
    readonly path: S extends Path ? S : Path;

  }

}

/**
 *
 */
export namespace Router.Route {

  /**
   *
   */
  export type Left<S extends string> = S extends `${infer L}${Path}` ? L : S;

  /**
   *
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
   *
   */
  export interface Segment<S extends string = string> {

    /**
     *
     */
    readonly child?: Segment;

    /**
     *
     */
    readonly params: Params<S>;

    /**
     *
     */
    readonly parent?: Segment;

    /**
     *
     */
    readonly route: Route;

  }

}

/**
 * Singleton router class.
 *
 * @decorator {@link Singleton}
 */
@Singleton<typeof Router>()
export class Router {

  /**
   * @param segment - Segment to be joined.
   * @returns Joined segment as string.
   */
  public join(segment: Router.Route.Segment): string {
    const parts = [] as string[];
    segment = this.rewind(segment);

    do {
      const paths = segment.route.path.split('/').slice(1);

      for (let path of paths) {
        if (path.startsWith(':')) {
          const key = path.replace(/^:(.+?)\??$/, '$1');
          path = (segment.params as any)[key];
        }

        parts.push(path);
      }
    } while (segment = segment.child!);

    return '/' + parts.join('/');
  }

  /**
   * @param path - Path to match against.
   * @param route - Route to use for matching.
   * @returns Matching segment or undefined.
   */
  public match(
    path: string,
    route: Router.Route
  ): Router.Route.Segment | undefined {
    const parts = path.split('/');
    const paths = route.path.split('/');
    const segment = { params: { }, route };

    for (let i = 0; i < paths.length; i++) {
      if (parts[i] === paths[i]) {
        continue;
      } else if (
        paths[i].startsWith(':') &&
        (parts[i] || paths[i].endsWith('?'))
      ) {
        const key = paths[i].replace(/^:(.+?)\??$/, '$1');
        assign(segment.params, { [key]: parts[i] || undefined });
        continue;
      }

      return undefined;
    }

    if (parts.length > paths.length && route.children?.length) {
      const rest = '/' + parts.slice(paths.length).join('/');

      for (const child of route.children) {
        const match = this.match(rest, child);

        if (match) {
          return assign(segment, {
            child: assign(match, {
              parent: segment
            })
          });
        }
      }

      return undefined;
    }

    return segment;
  }

  /**
   * @param segment - State to take segment from.
   * @returns Rewound state segment.
   */
  public rewind(segment: Router.Route.Segment): Router.Route.Segment {
    while (segment.parent) segment = segment.parent;
    return segment;
  }

}
