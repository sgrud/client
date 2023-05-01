import { from, switchMap } from 'rxjs';
import { Effect } from '../effect/effect';
import { Store } from '../store/store';
import { StateHandler } from './handler';

/**
 * The **Implant** decorator, when applied to classes extending the abstract
 * {@link Effect} base class, {@link StateHandler.implant}s the decorated class
 * under the `locate` in the global {@link sgrud.state.effects} namespace to be
 * used within {@link StateHandler.dispatch}ed {@link Store.Action}s.
 *
 * @param locate - The `locate` to address the {@link Effect} by.
 * @typeParam K - The {@link Store.Effect} `locate` type.
 * @typeParam T - An {@link Effect} constructor type.
 * @returns A class constructor decorator.
 *
 * @example
 * An `importScripts` **Effect**:
 * ```ts
 * import { Effect, Implant, type StateWorker, type Store } from '@sgrud/state';
 *
 * declare global {
 *   namespace sgrud.state.effects {
 *     function importScripts(...urls: (string | URL)[]): Promise<void>;
 *   }
 * }
 *
 * ⁠@Implant('importScripts')
 * export class FetchEffect extends Effect {
 *
 *   public override function(
 *     this: StateWorker
 *   ): Store.Effects['importScripts'] {
 *     return async(...urls) => {
 *       return importScripts(...urls);
 *     };
 *   }
 *
 * }
 * ```
 *
 * @see {@link StateHandler}
 * @see {@link Stateful}
 */
export function Implant<
  T extends new () => Effect<K>,
  K extends Store.Effect
>(locate: K) {

  /**
   * @param constructor - The class `constructor` to be decorated.
   */
  return function(constructor: T): void {
    from(StateHandler).pipe(switchMap((handler) => {
      return handler.implant(locate, constructor);
    })).subscribe();
  };

}
