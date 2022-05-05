import { provide, Provide } from '@sgrud/core';
import { Observable } from 'rxjs';
import { Model } from '../model/model';

/**
 * Namespace containing types and interfaces to be used in conjunction with the
 * abstract {@link Querier} base class and in context of the {@link Model} data
 * handling.
 *
 * @see {@link Model}
 * @see {@link Querier}
 */
export namespace Querier {

  /**
   * Type alias for a string union type of all known {@link Querier.Operation}
   * types: `'mutation'`, `'query'` and `'subscription'`.
   */
  export type Type =
    'mutation' |
    'query' |
    'subscription';

  /**
   * String literal helper type. Enforces any assigned string to conform to the
   * standard form of an operation: A string, starting with the
   * {@link Querier.Type}, followed by one whitespace and the operation content.
   */
  export type Operation = `${Querier.Type} ${string}`;

  /**
   * Interface describing the shape of variables which may be embedded within
   * {@link Querier.Operation}s. Variables are a simple key-value map, which can
   * be deeply nested.
   */
  export interface Variables {
    readonly [key: string]: Variables | unknown;
  }

}

/**
 * Abstract base class to implement data queriers. By extending this abstract
 * base class and providing the extending class to the {@link Linker}, e.g., by
 * {@link Target}ing it, the respective classes {@link priority} method will be
 * called whenever the {@link Model.commit} method is invoked and, if this class
 * claims the highest priority, its {@link commit} method will be called with an
 * `operation` and all the `variables` embedded within this operation.
 *
 * @decorator {@link Provide}
 *
 * @example Simple querier stub.
 * ```ts
 * import type { Model, Querier } from '@sgrud/data';
 * import { Provider, Target } from '@sgrud/core';
 * import type { Observable } from 'rxjs';
 *
 * @Target<typeof ExampleQuerier>()
 * export class ExampleQuerier
 *   extends Provider<typeof Querier>('sgrud.data.querier.Querier') {
 *
 *   public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
 *     'query'
 *   ]);
 *
 *   public override commit(
 *     operation: Querier.Operation,
 *     variables: Querier.Variables
 *   ): Observable<any> {
 *     throw new Error('Stub!');
 *   }
 *
 *   public override priority(model: Model.Type<any>): number {
 *     return 0;
 *   }
 *
 * }
 * ```
 *
 * @see {@link Model}
 */
@Provide<typeof Querier>()
export abstract class Querier {

  /**
   * Magic string by which this class is provided.
   *
   * @see {@link provide}
   */
  public static readonly [provide]:
  'sgrud.data.querier.Querier' = 'sgrud.data.querier.Querier';

  /**
   * A set containing the the {@link Querier.Type}s this class can handle. May
   * contain none to all of `'mutation'`, `'query'` and `'subscription'`.
   */
  public abstract readonly types: Set<Querier.Type>;

  /**
   * The overridden commit method of {@link Target}ed queriers is called by the
   * {@link Model.commit} method to commit operations. The invocation
   * arguments are the `operation`, unraveled into a string, and all
   * `variables` embedded within this operation. The extending class has to
   * serialize the {@link Querier.Variables} and transfer the operation. It's
   * the callers responsibility to unravel the {@link Querier.Operation} prior
   * to invoking this method, and to deserialize and error handle whatever
   * response is received.
   *
   * @param operation - Querier operation to be committed.
   * @param variables - Variables within the operation.
   * @returns An Observable of the committed operation.
   */
  public abstract commit(
    operation: Querier.Operation,
    variables: Querier.Variables
  ): Observable<any>;

  /**
   * Whenever the {@link Model.commit} method is invoked, all {@link Target}ed
   * and compatible queriers, i.e., implementations of the Querier class capable
   * of handling the specific {@link Querier.Type} of the to be committed
   * {@link Querier.Operation}, will be asked to prioritize themselves regarding
   * the respective `model`. The implementation claiming the highest priority
   * will be chosen and called to {@link commit} the outstanding operation.
   *
   * @param model - Model to be committed.
   * @returns Priority of this implementation.
   */
  public abstract priority(
    model: Model.Type<any>
  ): number;

}
