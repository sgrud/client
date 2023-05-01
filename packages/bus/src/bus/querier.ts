import { Provider, TypeOf } from '@sgrud/core';
import { Model, Querier } from '@sgrud/data';
import { Observable, defer, dematerialize } from 'rxjs';
import { Bus } from './bus';

/**
 * The **BusQuerier** implements an {@link Bus} based  {@link Querier}, i.e.,
 * extension of the abstract {@link Querier} base class, allowing {@link Model}
 * queries to be executed via a {@link Bus}. To use this class, provide it to
 * the {@link Linker} by either extending it, and decorating the extending class
 * with the {@link Target} decorator, or by preemptively supplying an instance
 * of this class to the {@link Linker}.
 *
 * @example
 * Provide the **BusQuerier** to the {@link Linker}:
 * ```ts
 * import { BusQuerier } from '@sgrud/bus';
 * import { Linker } from '@sgrud/core';
 *
 * new Linker<typeof BusQuerier>([
 *   [BusQuerier, new BusQuerier('io.github.sgrud.example')]
 * ]);
 * ```
 *
 * @see {@link Model}
 * @see {@link Querier}
 */
export class BusQuerier
  extends Provider<typeof Querier>('sgrud.data.Querier') {

  /**
   * A set containing the {@link Querier.Type}s this {@link BusQuerier} handles.
   * As a {@link Bus} is a long-lived duplex stream, this {@link Querier} can
   * handle `'mutation'`, `'query'` and `'subscription'` **types**.
   */
  public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
    'mutation',
    'query',
    'subscription'
  ]);

  /**
   * Public **constructor** consuming the `handle` {@link Model} queries should
   * be {@link commit}ted through, and an dynamic or static `prioritize` value.
   * The `prioritize` value may either be a mapping of {@link Model}s to
   * corresponding priorities or a static priority for this {@link Querier}.
   *
   * @param handle - The {@link Bus.Handle} to {@link commit} queries under.
   * @param prioritize - The dynamic or static prioritization.
   */
  public constructor(

    /**
     * The {@link Bus.Handle} to {@link commit} queries under.
     */
    private readonly handle: Bus.Handle,

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
   * @returns An {@link Observable} of the **commit**ted `operation`.
   */
  public override commit(
    operation: Querier.Operation,
    variables: Querier.Variables
  ): Observable<unknown> {
    return defer(() => {
      const seed = Math.random().toString(36).slice(2, 10);
      const type = operation.slice(0, operation.indexOf(' '));
      const bus = new Bus(`${this.handle}.${type}.${Date.now()}.${seed}`);

      bus.next({ query: operation, variables });
      bus.complete();

      return bus;
    }).pipe(dematerialize());
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
