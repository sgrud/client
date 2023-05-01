import { Subject } from 'rxjs';
import { Bus } from '../bus/bus';
import { BusHandler } from './handler';

/**
 * Prototype property decorator factory. This decorator **Publish**es a newly
 * instantiated {@link Subject} under the supplied `handle` and assigns it to
 * the decorated property. Depending on the value of the `suffix` parameter,
 * this newly instantiated {@link Subject} is either assigned directly to the
 * prototype and **Publish**ed using the supplied `handle`, or, if a truthy
 * value is supplied for the `suffix` parameter, this value is assumed to
 * reference another property of the class containing this decorated property.
 * The first truthy value assigned to this `suffix` property on an instance of
 * the class containing this **Publish** decorator will then be used to suffix
 * the supplied `handle` upon **Publish**ment of the newly instantiated
 * {@link Subject}, which is assigned to the decorated instance property.
 *
 * Through these two different modes of operation, the {@link Subject} that will
 * be **Publish**ed can be assigned statically to the prototype of the class
 * containing the decorated property, or this assignment can be deferred until
 * an instance of the class containing the decorated property is constructed and
 * a truthy value is assigned to its `suffix` property.
 *
 * This decorator is more or less the opposite of the {@link Observe} decorator,
 * while both rely on the {@link BusHandler} to fulfill contracts. Furthermore,
 * precautions should be taken to ensure the completion of the **Publish**ed
 * {@link Subject} as memory leaks may occur due to dangling subscriptions.
 *
 * @param handle - The {@link Bus.Handle} to **Publish**.
 * @param suffix - An optional `suffix` property for the `handle`.
 * @returns A prototype property decorator.
 *
 * @example
 * **Publish** the `'io.github.sgrud.example'` stream:
 * ```ts
 * import { Publish } from '@sgrud/bus';
 * import { type Subject } from 'rxjs';
 *
 * export class Publisher {
 *
 *   ⁠@Publish('io.github.sgrud.example')
 *   public readonly stream!: Subject<unknown>;
 *
 * }
 *
 * Publisher.prototype.stream.next('value');
 * Publisher.prototype.stream.complete();
 * ```
 *
 * @example
 * **Publish** the `'io.github.sgrud.example'` stream:
 * ```ts
 * import { Publish } from '@sgrud/bus';
 * import { type Subject } from 'rxjs';
 *
 * export class Publisher {
 *
 *   ⁠@Publish('io.github.sgrud', 'suffix')
 *   public readonly stream: Subject<unknown>;
 *
 *   public constructor(
 *     private readonly suffix: string
 *   ) {}
 *
 * }
 *
 * const publisher = new Publisher('example');
 * publisher.stream.next('value');
 * publisher.stream.complete();
 * ```
 *
 * @see {@link BusHandler}
 * @see {@link Observe}
 * @see {@link Stream}
 */
export function Publish(handle: Bus.Handle, suffix?: PropertyKey) {

  /**
   * @param prototype - The `prototype` to be decorated.
   * @param propertyKey - The `prototype` property to be decorated.
   */
  return function(prototype: object, propertyKey: PropertyKey): void {
    const handler = new BusHandler();

    if (!suffix) {
      const stream = new Subject<unknown>();
      handler.publish(handle, stream).subscribe();

      Object.defineProperty(prototype, propertyKey, {
        enumerable: true,
        get: (): Subject<unknown> => stream,
        set: Function.prototype as (...args: any[]) => any
      });
    } else {
      Object.defineProperty(prototype, suffix, {
        enumerable: true,
        set(this: object, value: string): void {
          if (value) {
            const stream = new Subject();
            handler.publish(`${handle}.${value}`, stream).subscribe();

            Object.defineProperties(this, {
              [suffix]: {
                enumerable: true,
                value
              },
              [propertyKey]: {
                enumerable: true,
                get: (): Subject<unknown> => stream,
                set: Function.prototype as (...args: any[]) => any
              }
            });
          }
        }
      });
    }
  };

}
