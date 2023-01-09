import { BusHandle } from '@sgrud/bus';
import { Linker } from '@sgrud/core';
import { Store } from '../store/store';
import { StateHandler } from './handler';

/**
 * @param handle -
 * @param state -
 * @returns .
 */
export function Transient<
  T extends Store.Type<I>,
  I extends Store = InstanceType<T>
>(handle: BusHandle, state: Store.State<I>) {

  /**
   * @param constructor - Class constructor to be decorated.
   */
  return function(
    constructor: T
  ): void {
    const linker = new Linker<typeof StateHandler | typeof Store>();
    const handler = linker.get(StateHandler) as StateHandler;

    handler.deploy(handle, constructor, state, true).subscribe((store) => {
      linker.set(constructor, store);
    });
  };

}
