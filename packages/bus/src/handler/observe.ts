import { dematerialize, Observable } from 'rxjs';
import { Bus } from '../bus/bus';
import { BusHandler } from './handler';

/**
 * Prototype property decorator factory. Applying this decorator replaces the
 * decorated property with a getter returning an {@link Observable} stream which
 * **Observe**s all values originating from the supplied `handle`. Depending on
 * the value of the `suffix` parameter, this {@link Observable} stream is either
 * assigned directly to the prototype using the supplied `handle`, or, if a
 * truthy value is supplied for the `suffix` parameter, this value is assumed to
 * reference another property of the class containing this decorated property.
 * The first truthy value assigned to this `suffix` property on an instance of
 * the class containing this **Stream** decorator will then be used to suffix
 * the supplied `handle` which is to be **Observe**d and assign the resulting
 * {@link Observable} stream to the decorated instance property.
 *
 * This decorator is more or less the opposite of the {@link Publish} decorator,
 * while both rely on the {@link BusHandler} to fulfill contracts.
 *
 * @param handle - The {@link Bus.Handle} to **Observe**.
 * @param suffix - An optional `suffix` property for the `handle`.
 * @returns A prototype property decorator.
 *
 * @example
 * **Observe** the `'io.github.sgrud.example'` stream:
 * ```ts
 * import { type Bus, Observe } from '@sgrud/bus';
 * import { type Observable } from 'rxjs';
 *
 * export class Observer {
 *
 *   ⁠@Observe('io.github.sgrud.example')
 *   public readonly stream!: Observable<Bus.Value<unknown>>;
 *
 * }
 *
 * Observer.prototype.stream.subscribe(console.log);
 * ```
 *
 * @example
 * **Observe** the `'io.github.sgrud.example'` stream:
 * ```ts
 * import { type Bus, Observe } from '@sgrud/bus';
 * import { type Observable } from 'rxjs';
 *
 * export class Observer {
 *
 *   ⁠@Observe('io.github.sgrud', 'suffix')
 *   public readonly stream!: Observable<Bus.Value<unknown>>;
 *
 *   public constructor(
 *     public readonly suffix: string
 *   ) { }
 *
 * }
 *
 * const observer = new Observer('example');
 * observer.stream.subscribe(console.log);
 * ```
 *
 * @see {@link BusHandler}
 * @see {@link Publish}
 * @see {@link Stream}
 */
export function Observe(handle: Bus.Handle, suffix?: PropertyKey) {

  /**
   * @param prototype - The `prototype` to be decorated.
   * @param propertyKey - The `prototype` property to be decorated.
   */
  return function(prototype: object, propertyKey: PropertyKey): void {
    const handler = new BusHandler();

    if (!suffix) {
      const stream = handler.observe(handle).pipe(
        dematerialize()
      );

      Object.defineProperty(prototype, propertyKey, {
        enumerable: true,
        get: (): Observable<unknown> => stream,
        set: Function.prototype as (...args: any[]) => any
      });
    } else {
      Object.defineProperty(prototype, suffix, {
        enumerable: true,
        set(this: object, value: string): void {
          if (value) {
            const stream = handler.observe(`${handle}.${value}`).pipe(
              dematerialize()
            );

            Object.defineProperties(this, {
              [suffix]: {
                enumerable: true,
                value
              },
              [propertyKey]: {
                enumerable: true,
                get: (): Observable<unknown> => stream,
                set: Function.prototype as (...args: any[]) => any
              }
            });
          }
        }
      });
    }
  };

}
