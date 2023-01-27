import { BusHandle } from '@sgrud/bus';
import { Linker } from '@sgrud/core';
import { from, switchMap } from 'rxjs';
import { Store } from '../store/store';
import { StateHandler } from './handler';

/**
 * @param handle -
 * @param state -
 * @param transient -
 * @typeParam I -
 * @typeParam T -
 * @returns .
 */
export function Stateful<
  T extends Store.Type<I>,
  I extends Store = InstanceType<T>
>(handle: BusHandle, state: Store.State<I>, transient: boolean = false) {

  /**
   * @param constructor - Class constructor to be decorated.
   */
  return function(
    constructor: T
  ): void {
    from(StateHandler).pipe(switchMap((handler) => {
      return handler.deploy(handle, constructor, state, transient);
    })).subscribe((store) => new Linker<typeof Store>([
      [constructor, store]
    ]));
  };

}
