import { TypeOf } from '@sgrud/core';
import { Observable, Subject } from 'rxjs';
import { ConduitHandle, ConduitHandler } from '../conduit/handler';

/**
 * Prototype property decorator factory. This decorator **publish**es the
 * decorated property value under the supplied `handle`. If the supplied
 * `source` isn't an [Observable][] it is assumed to reference a property key of
 * the prototype containing the decorated property. The first instance value
 * assigned to this `source` property is assigned as readonly on the instance
 * and appended to the supplied `handle`, thus creating an *instance-scoped
 * handle*. This *scoped handle* is then used to **publish** the first instance
 * value assigned to the decorated property. This implies that the publication
 * to the underlying bus will wait until both the decorated property and the
 * referenced `source` property are assigned values. If the supplied `source` is
 * of an [Observable][] type, this [Observable][] is **publish**ed under the
 * supplied `handle` and assigned as readonly to the decorated prototype
 * property. If no `source` is supplied, a new [Subject][] will be created and
 * implicitly supplied as `source`. This decorator is more or less the opposite
 * of the [Subscribe][] decorator, while both rely on the [BusHandler][] to
 * fulfill contracts.
 *
 * Precautions should be taken to ensure completion of the supplied
 * [Observable][] `source` as otherwise memory leaks may occur due to dangling
 * subscriptions.
 *
 * [BusHandle]: https://sgrud.github.io/client/types/bus.BusHandle
 * [BusHandler]: https://sgrud.github.io/client/classes/bus.BusHandler
 * [Observable]: https://rxjs.dev/api/index/class/Observable
 * [Subject]: https://rxjs.dev/api/index/class/Subject
 * [Subscribe]: https://sgrud.github.io/client/functions/bus.Subscribe
 *
 * @param handle - [BusHandle][] to **publish**.
 * @param source - Property key or [Observable][].
 * @returns Prototype property decorator.
 *
 * @example
 * **Publish** the `'io.github.sgrud.example'` bus:
 * ```ts
 * import type { Subject } from 'rxjs';
 * import { Publish } from '@sgrud/bus';
 *
 * export class Publisher {
 *
 *   ⁠@Publish('io.github.sgrud.example')
 *   public readonly bus!: Subject<any>;
 *
 * }
 *
 * Publisher.prototype.bus.complete();
 * ```
 *
 * @example
 * **Publish** the `'io.github.sgrud.example'` bus:
 * ```ts
 * import { Publish } from '@sgrud/bus';
 * import { Subject } from 'rxjs';
 *
 * export class Publisher {
 *
 *   ⁠@Publish('io.github.sgrud', 'scope')
 *   public readonly bus: Subject<any> = new Subject<any>();
 *
 *   public constructor(
 *     private readonly scope: string
 *   ) { }
 *
 * }
 *
 * const publisher = new Publisher('example');
 * publisher.bus.complete();
 * ```
 *
 * @see [BusHandler][]
 * @see [Subscribe][]
 */
export function Publish(
  handle: ConduitHandle,
  source: string | Observable<any> = new Subject<any>()
) {

  /**
   * @param prototype - Prototype to be decorated.
   * @param propertyKey - Prototype property to be decorated.
   */
  return function(
    prototype: object,
    propertyKey: PropertyKey
  ): void {
    if (TypeOf.string(source)) {
      Object.defineProperties(prototype, {
        [source]: {
          enumerable: true,
          set(this: any, value: string): void {
            Object.defineProperty(this, source, {
              enumerable: true,
              value
            });

            if (this[propertyKey]) {
              new ConduitHandler([
                [`${handle}.${value}`, this[propertyKey]]
              ]);
            }
          }
        },
        [propertyKey]: {
          enumerable: true,
          set(this: any, value: Observable<any>): void {
            Object.defineProperty(this, propertyKey, {
              enumerable: true,
              value
            });

            if (this[source]) {
              new ConduitHandler([
                [`${handle}.${this[source]}`, value]
              ]);
            }
          }
        }
      });
    } else {
      Object.defineProperty(prototype, propertyKey, {
        enumerable: true,
        value: source
      });

      new ConduitHandler([
        [handle, source]
      ]);
    }
  };

}
