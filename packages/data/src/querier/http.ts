import { HttpClient, Kernel, Provider, TypeOf } from '@sgrud/core';
import { Observable, pluck } from 'rxjs';
import { Model } from '../model/model';
import { Querier } from './querier';

/**
 * HTTP based data querier, i.e., extension of the abstract {@link Querier} base
 * class, allowing data queries to be committed via HTTP. To use this class,
 * provide it to the {@link Linker} by either extending it, and decorating the
 * extending class with the {@link Target} decorator, or by preemptively
 * supplying an instance of this class to the Linker.
 *
 * @example Provide the HttpQuerier class to the Linker.
 * ```ts
 * import { HttpQuerier } from '@sgrud/data';
 * import { Linker } from '@sgrud/core';
 * import type { Target } from '@sgrud/core';
 * import { from } from 'rxjs';
 *
 * new Linker<typeof HttpQuerier, HttpQuerier>([
 *   [HttpQuerier, new HttpQuerier('https://api.example.com')]
 * ]);
 * ```
 *
 * @see {@link Model}
 * @see {@link Querier}
 */
export class HttpQuerier
  extends Provider<typeof Querier>('sgrud.data.querier.Querier') {

  /**
   * A set containing the the {@link Querier.Type}s this {@link Model} querier
   * can handle. As HTTP connections are short-lived, this querier may only
   * handle one-off querier types, namely `'mutation'` and `'query'`.
   */
  public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
    'mutation',
    'query'
  ]);

  /**
   * Public constructor consuming the HTTP `endpoint` {@link Model} queries
   * should be {@link commit}ted against, and an dynamic or static `prioritize`
   * value. The `prioritize` value may either be a mapping of Models to
   * corresponding priorities or a static priority for this querier.
   *
   * @param endpoint - HTTP querier endpoint.
   * @param prioritize - Dynamic or static prioritization.
   */
  public constructor(
    private readonly endpoint: string = `${new Kernel().endpoint}/data`,
    private readonly prioritize: number | Map<Model.Type<any>, number> = 0
  ) {
    super();
  }

  /**
   * Overridden commit method of the {@link Querier} base class. When this
   * {@link Model} querier is made available via the {@link Linker}, this
   * overridden method is called whenever this querier claims the highest
   * {@link priority} to commit an operation, depending on the {@link Model}
   * from which the {@link Querier.Operation} originates.
   *
   * @param operation - Querier operation to be committed.
   * @param variables - Variables within the operation.
   * @returns An Observable of the committed operation.
   */
  public override commit(
    operation: Querier.Operation,
    variables: Querier.Variables
  ): Observable<any> {
    return HttpClient.post(this.endpoint, {
      query: operation,
      variables
    }).pipe(pluck('response'));
  }

  /**
   * Overridden {@link priority} method of the {@link Querier} base class. When
   * a {@link Querier.Operation} is to be committed, this method is called with
   * the respective `model` constructor and returns the claimed priority to
   * commit this Model.
   *
   * @param model - Model to be committed.
   * @returns Priority of this implementation.
   */
  public override priority(model: Model.Type<any>): number {
    if (TypeOf.number(this.prioritize)) {
      return this.prioritize;
    }

    return this.prioritize.get(model) ?? 0;
  }

}
