import { Http, Provider, TypeOf } from '@sgrud/core';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { Model } from '../model/model';
import { Querier } from './querier';

/**
 * The **HttpQuerier** class implements an {@link Http} based {@link Querier},
 * i.e., an extension of the abstract {@link Querier} base class, allowing for
 * {@link Model} queries to be executed via HTTP. To use this class, provide it
 * to the {@link Linker} by either extending it, and decorating the extending
 * class with the {@link Target} decorator, or by preemptively supplying an
 * instance of this class to the {@link Linker}.
 *
 * @example
 * Provide the **HttpQuerier** to the {@link Linker}:
 * ```ts
 * import { Linker } from '@sgrud/core';
 * import { HttpQuerier } from '@sgrud/data';
 *
 * new Linker<typeof HttpQuerier>([
 *   [HttpQuerier, new HttpQuerier('https://api.example.com')]
 * ]);
 * ```
 *
 * @see {@link Model}
 * @see {@link Querier}
 */
export class HttpQuerier
  extends Provider<typeof Querier>('sgrud.data.Querier') {

  /**
   * A set containing the {@link Querier.Type}s this {@link Querier} can handle.
   * As HTTP connections are short-lived, the {@link HttpQuerier} may only
   * handle one-off **types**, namely `'mutation'` and `'query'`.
   */
  public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
    'mutation',
    'query'
  ]);

  /**
   * Public **constructor** consuming the HTTP `endpoint` {@link Model} queries
   * should be {@link commit}ted against, and an dynamic or static `prioritize`
   * value. The `prioritize` value may either be a mapping of {@link Model}s to
   * corresponding priorities or a static priority for this {@link Querier}.
   *
   * @param endpoint - The HTTP `endpoint` to {@link commit} queries against.
   * @param prioritize - The dynamic or static prioritization.
   */
  public constructor(

    /**
     * The HTTP `endpoint` to {@link commit} queries against.
     */
    private readonly endpoint: string,

    /**
     * The dynamic or static prioritization.
     *
     * @defaultValue `0`
     *
     * @see {@link priority}
     */
    private readonly prioritize: number | Map<Model.Type<Model>, number> = 0

  ) {
    super();
  }

  /**
   * Overridden **commit** method of the {@link Querier} base class. When this
   * {@link Querier} is made available via the {@link Linker}, this overridden
   * **commit** method is called when this {@link Querier} claims the highest
   * {@link priority} to **commit** an {@link Querier.Operation}, depending on
   * the {@link Model} from which the {@link Querier.Operation} originates.
   *
   * @param operation - The {@link Querier.Operation} to be **commit**ted.
   * @param variables - Any {@link Querier.Variables} within the `operation`.
   * @returns An {@link Observable} of the committed {@link Querier.Operation}.
   * @throws An {@link Observable} of an {@link AggregateError}.
   */
  public override commit(
    operation: Querier.Operation,
    variables?: Querier.Variables
  ): Observable<unknown> {
    return Http.post<{
      data?: unknown;
      errors?: string[];
    }>(this.endpoint, {
      query: operation,
      variables
    }).pipe(switchMap((next) => {
      return next.response.errors?.length
        ? throwError(() => new AggregateError(next.response.errors!))
        : of(next.response.data);
    }));
  }

  /**
   * Overridden **priority** method of the {@link Querier} base class. When an
   * {@link Querier.Operation} is to be {@link commit}ted, this method is called
   * with the respective `model` {@link Model.Type} and returns the claimed
   * **priority** to {@link commit} this {@link Model}.
   *
   * @param model - The {@link Model} to be {@link commit}ted.
   * @returns The numeric **priority** of this {@link Querier} implementation.
   */
  public override priority(model: Model.Type<Model>): number {
    if (TypeOf.number(this.prioritize)) {
      return this.prioritize;
    }

    return this.prioritize.get(model) ?? 0;
  }

}
