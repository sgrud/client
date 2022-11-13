import { BusHandle, BusHandler } from './handler';

/**
 * Prototype property decorator factory. This decorator **subscribe**s to an
 * [Observable][] emitting [BusValue][]s originating from the supplied `handle`
 * by assigning it to the decorated property. If no `source` is supplied, this
 * [Observable][] is assigned as readonly to the decorated prototype property.
 * Else the supplied `source` is assumed to be referencing a property key of the
 * prototype containing the decorated property. The first instance value
 * assigned to this `source` property is assigned as readonly on the instance
 * and appended to the supplied `handle`, thus creating an _instance-scoped
 * handle_. This _scoped handle_ is then used to create an [Observable][] which
 * is assigned as readonly to the decorated property on the instance. This
 * implies that the decorated property will not be assigned an [Observable][]
 * until the referenced `source` property is assigned an instance value. This
 * decorator is more or less the opposite of the [Publish][] decorator, while
 * both rely on the [BusHandler][] to fulfill contracts.
 *
 * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
 * [BusHandler]: https://sgrud.github.io/client/classes/bus.BusHandler
 * [BusValue]: https://sgrud.github.io/client/interfaces/bus.BusValue
 * [Observable]: https://rxjs.dev/api/index/class/Observable
 * [Publish]: https://sgrud.github.io/client/functions/bus.Publish
 *
 * @param handle - [BusHandle][] to **subscribe** to.
 * @param source - Property key.
 * @returns Prototype property decorator.
 *
 * @example
 * **Subscribe** to the `'io.github.sgrud.example'` bus:
 * ```ts
 * import type { BusValue } from '@sgrud/bus';
 * import type { Observable } from 'rxjs';
 * import { Subscribe } from '@sgrud/bus';
 *
 * export class Subscriber {
 *
 *   ⁠@Subscribe('io.github.sgrud.example')
 *   public readonly bus!: Observable<BusValue<any>>;
 *
 * }
 * ```
 *
 * @example
 * **Subscribe** to the `'io.github.sgrud.example'` bus:
 * ```ts
 * import type { BusValue } from '@sgrud/bus';
 * import type { Observable } from 'rxjs';
 * import { Subscribe } from '@sgrud/bus';
 *
 * export class Subscriber {
 *
 *   ⁠@Subscribe('io.github.sgrud', 'scope')
 *   public readonly bus!: Observable<BusValue<any>>;
 *
 *   public constructor(
 *     public readonly scope: string
 *   ) { }
 *
 * }
 *
 * const subscriber = new Subscriber('example');
 * ```
 *
 * @see [BusHandler][]
 * @see [Publish][]
 */
export function Subscribe(handle: BusHandle, source?: PropertyKey) {

  /**
   * @param prototype - Prototype to be decorated.
   * @param propertyKey - Prototype property to be decorated.
   */
  return function(
    prototype: object,
    propertyKey: PropertyKey
  ): void {
    if (source) {
      Object.defineProperty(prototype, source, {
        enumerable: true,
        set(this: any, value: string): void {
          Object.defineProperties(this, {
            [source]: {
              enumerable: true,
              value
            },
            [propertyKey]: {
              enumerable: true,
              value: new BusHandler().get(`${handle}.${value}`)
            }
          });
        }
      });
    } else {
      Object.defineProperty(prototype, propertyKey, {
        enumerable: true,
        value: new BusHandler().get(handle)
      });
    }
  };

}
