import { from, switchMap } from 'rxjs';
import { Effect } from '../effect/effect';
import { Store } from '../store/store';
import { StateHandler } from './handler';

/**
 * @param locate -
 * @typeParam K -
 * @typeParam T -
 * @returns .
 */
export function Implant<
  T extends new () => Effect<K>,
  K extends keyof Store.Effects
>(locate: K) {

  /**
   * @param constructor - Class constructor to be decorated.
   */
  return function(
    constructor: T
  ): void {
    from(StateHandler).pipe(switchMap((handler) => {
      return handler.implant(locate, constructor);
    })).subscribe();
  };

}
