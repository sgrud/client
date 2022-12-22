import { HttpClient, Kernel, Provider, TypeOf } from '@sgrud/core';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { Model } from '../model/model';
import { Querier } from './querier';

/**
 * HTTP based data [Querier][], i.e., extension of the abstract [Querier][] base
 * class, allowing [Model][] data queries to be committed via HTTP. To use this
 * class, provide it to the [Linker][] by either extending it, and decorating
 * the extending class with the [Target][] decorator, or by preemptively
 * supplying an instance of this class to the [Linker][].
 *
 * [Linker]: https://sgrud.github.io/client/classes/core.Linker
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 * [Querier]: https://sgrud.github.io/client/classes/data.Querier
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 *
 * @example
 * Provide the **HttpQuerier** to the [Linker][]:
 * ```ts
 * import { Linker } from '@sgrud/core';
 * import { HttpQuerier } from '@sgrud/data';
 *
 * new Linker<typeof HttpQuerier>([[
 *   HttpQuerier,
 *   new HttpQuerier('https://api.example.com')
 * ]]);
 * ```
 *
 * @see [Model][]
 * @see [Querier][]
 */
export class HttpQuerier
  extends Provider<typeof Querier>('sgrud.data.querier.Querier') {

  /**
   * A set containing the the [Type][]s this [Querier][] can handle. As HTTP
   * connections are short-lived, this [Querier][] may only handle one-off query
   * [Type][]s, namely `'mutation'` and `'query'`.
   *
   * [Querier]: https://sgrud.github.io/client/classes/data.Querier
   * [Type]: https://sgrud.github.io/client/types/data.Querier-1.Type
   */
  public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
    'mutation',
    'query'
  ]);

  /**
   * Public **constructor** consuming the HTTP `endpoint` [Model][] queries
   * should be fired against, and an dynamic or static `prioritize` value. The
   * `prioritize` value may either be a mapping of [Model][]s to corresponding
   * priorities or a static priority for this querier.
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   *
   * @param endpoint - HTTP endpoint to fire [Model][] queries against.
   * @param prioritize - Dynamic or static prioritization.
   */
  public constructor(

    /**
     * HTTP endpoint to fire [Model][] queries against.
     *
     * [Model]: https://sgrud.github.io/client/classes/data.Model
     *
     * @defaultValue `new Kernel().endpoint + '/data'`
     *
     */
    private readonly endpoint: string = new Kernel().endpoint + '/data',

    /**
     * Dynamic or static prioritization.
     *
     * @defaultValue `0`
     */
    private readonly prioritize: number | Map<Model.Type<any>, number> = 0

  ) {
    super();
  }

  /**
   * Overridden **commit** method of the [Querier][] base class. When this
   * [Model][] querier is made available via the [Linker][], this overridden
   * method is called whenever this querier claims the highest *priority* to
   * *commit* an [Operation][], depending on the [Model][] from which the
   * [Operation][] originates.
   *
   * [Linker]: https://sgrud.github.io/client/classes/core.Linker
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Operation]: https://sgrud.github.io/client/types/data.Querier-1.Operation
   * [Querier]: https://sgrud.github.io/client/classes/data.Querier
   *
   * @param operation - Querier [Operation][] to be committed.
   * @param variables - Variables within the [Operation][].
   * @returns [Observable][] of the committed [Operation][].
   * @throws [Observable][] of an AggregateError.
   */
  public override commit(
    operation: Querier.Operation,
    variables?: Querier.Variables
  ): Observable<any> {
    return HttpClient.post<any>(this.endpoint, {
      query: operation,
      variables
    }).pipe(switchMap(({ response }) => {
      return response.errors?.length
        ? throwError(() => new AggregateError(response.errors))
        : of(response.data);
    }));
  }

  /**
   * Overridden **priority** method of the [Querier][] base class. When an
   * [Operation][] is to be committed, this method is called with the respective
   * `model` constructor and returns the claimed priority to commit this
   * [Model][].
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   * [Operation]: https://sgrud.github.io/client/types/data.Querier-1.Operation
   * [Querier]: https://sgrud.github.io/client/classes/data.Querier
   *
   * @param model - [Model][] to be committed.
   * @returns Priority of this implementation.
   */
  public override priority(model: Model.Type<any>): number {
    if (TypeOf.number(this.prioritize)) {
      return this.prioritize;
    }

    return this.prioritize.get(model) ?? 0;
  }

}
