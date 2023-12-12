import { Alias, provide, Provide } from '@sgrud/core';
import { Observable } from 'rxjs';
import { Model } from '../model/model';

/**
 * **Querier** namespace containing types and interfaces used and intended to be
 * used in conjunction with the abstract {@link Querier} base class and in
 * context of the {@link Model} data handling.
 *
 * @see {@link Querier}
 */
export namespace Querier {

  /**
   * Type alias for a string union type of all known {@link Operation}
   * **Type**s: `'mutation'`, `'query'` and `'subscription'`.
   */
  export type Type =
    'mutation' |
    'query' |
    'subscription';

  /**
   * String literal helper type. Enforces any assigned string to conform to the
   * standard form of an **Operation**: A string starting with the {@link Type},
   * followed by one whitespace and the operation content.
   */
  export type Operation = Alias<`${Type} ${string}`>;

  /**
   * Interface describing the shape of **Variables** which may be embedded
   * within {@link Operation}s. **Variables** are a simple key-value map, which
   * can be deeply nested.
   */
  export interface Variables {

    /**
     * Index signature allowing keys to be of type `string` and values of type
     * {@link Variables} or `unknown`.
     */
    readonly [key: string]: Variables | unknown;

  }

}

/**
 * Abstract **Querier** base class to implement {@link Model} **Querier**s. By
 * extending this abstract base class and providing the extending class to the
 * {@link Linker}, e.g., by {@link Target}ing it, the {@link priority} method of
 * the resulting class will be called whenever the {@link Model} requests or
 * persists data and, if this class claims the highest priority, its
 * {@link commit} method will be called.
 *
 * @decorator {@link Provide}
 *
 * @example
 * Simple **Querier** stub:
 * ```ts
 * import { Provider, Target } from '@sgrud/core';
 * import { type Querier } from '@sgrud/data';
 * import { type Observable } from 'rxjs';
 *
 * ⁠@Target()
 * export class ExampleQuerier
 *   extends Provider<typeof Querier>('sgrud.data.Querier') {
 *
 *   public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
 *     'query'
 *   ]);
 *
 *   public override commit(
 *     operation: Querier.Operation,
 *     variables: Querier.Variables
 *   ): Observable<unknown> {
 *     throw new Error('Stub!');
 *   }
 *
 *   public override priority(): number {
 *     return 0;
 *   }
 *
 * }
 * ```
 *
 * @see {@link Model}
 */
@Provide()
export abstract class Querier {

  /**
   * Magic string by which this class is {@link provide}d.
   *
   * @see {@link provide}
   */
  public static readonly [provide]: 'sgrud.data.Querier' = 'sgrud.data.Querier';

  /**
   * A set containing all **types** of queries this {@link Querier} can handle.
   * May contain any of the `'mutation'`, `'query'` and `'subscription'`
   * {@link Type}s.
   */
  public abstract readonly types: Set<Querier.Type>;

  /**
   * The overridden **commit** method of {@link Target}ed {@link Querier}s is
   * called by the {@link Model} to execute {@link Operation}s. The invocation
   * arguments are the `operation`, unraveled into a string, and all `variables`
   * embedded within this operation. The extending class has to serialize the
   * {@link Variables} and handle the operation. It's the callers responsibility
   * to unravel the {@link Operation} prior to invoking this method, and to
   * deserialize and (error) handle whatever response is received.
   *
   * @param operation - The {@link Operation} to be **commit**ted.
   * @param variables - Any {@link Variables} within the {@link Operation}.
   * @returns An {@link Observable} of the **commit**ted {@link Operation}.
   */
  public abstract commit(
    operation: Querier.Operation,
    variables?: Querier.Variables
  ): Observable<unknown>;

  /**
   * When the {@link Model} executes {@link Operation}s, all {@link Target}ed
   * and compatible {@link Querier}s, i.e., implementations of the this class
   * capable of handling the specific {@link Type} of the {@link Operation} to
   * {@link commit}, will be asked to prioritize themselves regarding the
   * respective {@link Model}. The querier claiming the highest **priority**
   * will be chosen and its {@link commit} method called.
   *
   * @param model - The {@link Model} to be {@link commit}ted.
   * @returns The numeric **priority** of this {@link Querier} implementation.
   */
  public abstract priority(model: Model.Type<Model>): number;

}
