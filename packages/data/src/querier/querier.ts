import { provide, Provide } from '@sgrud/core';
import { Observable } from 'rxjs';
import { Model } from '../model/model';

/**
 * Namespace containing types and interfaces used and intended to be used in
 * conjunction with the abstract [Querier][] base class and in context of the
 * [Model][] data handling.
 *
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 * [Querier]: https://sgrud.github.io/client/classes/data.Querier
 *
 * @see [Querier][]
 */
export namespace Querier {

  /**
   * Type alias for a string union type of all known [Operation][] types:
   * `'mutation'`, `'query'` and `'subscription'`.
   *
   * [Operation]: https://sgrud.github.io/client/types/data.Querier-1.Operation
   */
  export type Type =
    'mutation' |
    'query' |
    'subscription';

  /**
   * String literal helper type. Enforces any assigned string to conform to the
   * standard form of an operation: A string, starting with the [Type][],
   * followed by one whitespace and the operation content.
   *
   * [Type]: https://sgrud.github.io/client/types/data.Querier-1.Type
   */
  export type Operation = `${Querier.Type} ${string}`;

  /**
   * Interface describing the shape of variables which may be embedded within
   * [Operation][]s. Variables are a simple key-value map, which can be deeply
   * nested.
   *
   * [Operation]: https://sgrud.github.io/client/types/data.Querier-1.Operation
   */
  export interface Variables {
    readonly [key: string]: Variables | unknown;
  }

}

/**
 * Abstract **Querier** base class to implement [Model][] data queriers. By
 * extending this abstract base class and providing the extending class to the
 * [Linker][], e.g., by [Target][]ing it, the respective classes *priority*
 * method will be called whenever the [Model][] *commits* data and, if this
 * class claims the highest priority, its *commit* method will be called.
 *
 * [Linker]: https://sgrud.github.io/client/classes/core.Linker
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 * [Provide]: https://sgrud.github.io/client/functions/core.Provide-1
 * [Target]: https://sgrud.github.io/client/functions/core.Target
 *
 * @decorator [Provide][]
 *
 * @example
 * Simple **Querier** stub:
 * ```ts
 * import type { Model, Querier } from '@sgrud/data';
 * import type { Observable } from 'rxjs';
 * import { Provider, Target } from '@sgrud/core';
 *
 * ⁠@Target<typeof ExampleQuerier>()
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
 * @see [Model][]
 */
@Provide<typeof Querier>()
export abstract class Querier {

  /**
   * Magic string by which this class is [provide][]d.
   *
   * [provide]: https://sgrud.github.io/client/variables/core.provide-2
   *
   * @see [provide][]
   */
  public static readonly [provide]:
  'sgrud.data.querier.Querier' = 'sgrud.data.querier.Querier' as const;

  /**
   * A set containing all [Type][]s of queries this class can handle. May
   * contain none to all of `'mutation'`, `'query'` and `'subscription'`.
   *
   * [Type]: https://sgrud.github.io/client/types/data.Querier-1.Type
   */
  public abstract readonly types: Set<Querier.Type>;

  /**
   * The overridden **commit** method of [Target][]ed queriers is called by the
   * [Model][] to **commit** operations. The invocation arguments are the
   * `operation`, unraveled into a string, and all `variables` embedded within
   * this operation. The extending class has to serialize the [Variables][] and
   * transfer the operation. It's the callers responsibility to unravel the
   * [Operation][] prior to invoking this method, and to deserialize and (error)
   * handle whatever response is received.
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Operation]: https://sgrud.github.io/client/types/data.Querier-1.Operation
   * [Target]: https://sgrud.github.io/client/functions/core.Target
   * [Variables]: https://sgrud.github.io/client/interfaces/data.Querier-1.Variables
   *
   * @param operation - Querier [Operation][] to be committed.
   * @param variables - [Variables][] within the [Operation][].
   * @returns [Observable][] of the committed [Operation][].
   */
  public abstract commit(
    operation: Querier.Operation,
    variables?: Querier.Variables
  ): Observable<any>;

  /**
   * Whenever the *commit* method of the [Model][] is invoked, all [Target][]ed
   * and compatible queriers, i.e., implementations of the this class capable of
   * handling the specific [Type][] of the to be committed [Operation][], will
   * be asked to prioritize themselves regarding the respective [Model][]. The
   * querier claiming the highest **priority** will be chosen and its *commit*
   * method called.
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   * [Operation]: https://sgrud.github.io/client/types/data.Querier-1.Operation
   * [Target]: https://sgrud.github.io/client/functions/core.Target
   * [Type]: https://sgrud.github.io/client/types/data.Querier-1.Type
   *
   * @param model - [Model][] to be committed.
   * @returns Priority of this implementation.
   */
  public abstract priority(
    model: Model.Type<any>
  ): number;

}
