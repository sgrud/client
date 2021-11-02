import { TypeOf } from '@sgrud/core';
import { Observable, Subject } from 'rxjs';
import { ConduitHandle, ConduitHandler } from '../conduit/handler';

/**
 * Prototype property decorator factory. This decorator publishes the decorated
 * property value under the supplied `handle`. If the supplied `source` is a
 * string it is assumed to reference a property key of the prototype containing
 * the decorated property. The first instance value assigned to this `source`
 * property is assigned as readonly on the instance and appended to the supplied
 * `handle`, thus creating an _instance-scoped handle_. This _scoped handle_ is
 * then used to publish the first instance value assigned to the decorated
 * property. This implies that the publication will wait until both the
 * decorated property and the referenced `source` property are assigned values.
 * If the supplied `source` is of an Observable type, this Observable is
 * published under the supplied `handle` and assigned as readonly to the
 * decorated prototype property. If no `source` is supplied, a new Subject will
 * be created and implicitly supplied as `source`.
 *
 * Precautions should be taken to ensure completion of the supplied observable
 * source as otherwise memory leaks may occur due to dangling subscriptions.
 *
 * @param handle - Conduit handle.
 * @param source - Property key or Observable.
 * @returns Prototype property decorator.
 *
 * @example Publish the `'io.github.sgrud.example'` conduit.
 * ```ts
 * import { Publish } from '@sgrud/bus';
 * import type { Subject } from 'rxjs';
 *
 * export class Publisher {
 *
 *   @Publish('io.github.sgrud.example')
 *   public readonly conduit!: Subject<any>;
 *
 * }
 *
 * Publisher.prototype.conduit.complete();
 * ```
 *
 * @example Publish the `'io.github.sgrud.example'` conduit.
 * ```ts
 * import { Publish } from '@sgrud/bus';
 * import { Subject } from 'rxjs';
 *
 * export class Publisher {
 *
 *   @Publish('io.github.sgrud', 'scope')
 *   public readonly conduit: Subject<any> = new Subject<any>();
 *
 *   public constructor(
 *     public readonly scope: string
 *   ) { }
 *
 * }
 *
 * const publisher = new Publisher('example');
 * publisher.conduit.complete();
 * ```
 *
 * @see {@link ConduitHandler}
 * @see {@link Subscribe}
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
    prototype: Object,
    propertyKey: PropertyKey
  ): void {
    if (TypeOf.string(source)) {
      Object.defineProperties(prototype, {
        [source]: {
          enumerable: true,
          set: function(this: any, value: string): void {
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
          set: function(this: any, value: Observable<any>): void {
            Object.defineProperty(this, propertyKey, {
              enumerable: true,
              value
            });

            if (this[source]) {
              new ConduitHandler([
                [`${handle}.${this[source] as string}`, value]
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
