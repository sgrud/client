import { Bus } from '../bus/bus';

/**
 * Prototype property decorator factory. Applying this decorator replaces the
 * decorated property with a getter returning a {@link Bus}, thereby allowing to
 * duplex **Stream** values designated by the supplied `handle`. Depending on
 * the value of the `suffix` parameter, this {@link Bus} is either assigned
 * directly to the prototype using the supplied `handle`, or, if a truthy value
 * is supplied for the `suffix` parameter, this value is assumed to reference
 * another property of the class containing this decorated property. The first
 * truthy value assigned to this `suffix` property on an instance of the class
 * containing this **Stream** decorator will then be used to suffix the supplied
 * `handle` upon construction of the {@link Bus}, which is assigned to the
 * decorated instance property.
 *
 * Through these two different modes of operation, a {@link Bus} can be assigned
 * statically to the prototype of the class containing the decorated property,
 * or this assignment can be deferred until an instance of the class containing
 * the decorated property is constructed and a truthy value is assigned to its
 * `suffix` property.
 *
 * @param handle - The {@link Bus.Handle} to **Stream**.
 * @param suffix - An optional `suffix` property for the `handle`.
 * @returns A prototype property decorator.
 *
 * @example
 * **Stream** `'io.github.sgrud.example'`:
 * ```ts
 * import { type Bus, Stream } from '@sgrud/bus';
 *
 * export class Streamer {
 *
 *   ⁠@Stream('io.github.sgrud.example')
 *   public readonly stream!: Bus<unknown, unknown>;
 *
 * }
 *
 * Streamer.prototype.stream.next('value');
 * Streamer.prototype.stream.complete();
 *
 * Streamer.prototype.stream.subscribe({
 *   next: console.log
 * });
 * ```
 *
 * @example
 * **Stream** `'io.github.sgrud.example'`:
 * ```ts
 * import { type Bus, Stream } from '@sgrud/bus';
 *
 * export class Streamer {
 *
 *   ⁠@Stream('io.github.sgrud', 'suffix')
 *   public readonly stream!: Bus<unknown>;
 *
 *   public constructor(
 *     public readonly suffix: string
 *   ) { }
 *
 * }
 *
 * const streamer = new Streamer('example');
 * streamer.stream.next('value');
 * streamer.stream.complete();
 *
 * streamer.stream.subscribe({
 *   next: console.log
 * });
 * ```
 *
 * @see {@link BusHandler}
 * @see {@link Observe}
 * @see {@link Publish}
 */
export function Stream(handle: Bus.Handle, suffix?: PropertyKey) {

  /**
   * @param prototype - The `prototype` to be decorated.
   * @param propertyKey - The `prototype` property to be decorated.
   */
  return function(prototype: object, propertyKey: PropertyKey): void {
    if (!suffix) {
      const stream = new Bus<unknown, unknown>(handle);

      Object.defineProperty(prototype, propertyKey, {
        enumerable: true,
        get: (): Bus<unknown, unknown> => stream,
        set: Function.prototype as (...args: any[]) => any
      });
    } else {
      Object.defineProperty(prototype, suffix, {
        enumerable: true,
        set(this: object, value: string): void {
          if (value) {
            const scoped = `${handle}.${value}` as Bus.Handle;
            const stream = new Bus(scoped);

            Object.defineProperties(this, {
              [suffix]: {
                enumerable: true,
                value
              },
              [propertyKey]: {
                enumerable: true,
                get: (): Bus<unknown, unknown> => stream,
                set: Function.prototype as (...args: any[]) => any
              }
            });
          }
        }
      });
    }
  };

}
