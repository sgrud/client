import { TypeOf } from '@sgrud/core';
import { ConduitHandle, ConduitHandler } from '../conduit/handler';

/**
 * Prototype property decorator factory. This decorator assigns an Observable
 * emitting {@link ConduitValue}s originating from the supplied `handle` to the
 * decorated property. If no `source` is supplied, this Observable is assigned
 * as readonly to the decorated prototype property. Else the supplied `source`
 * is assumed to be a string referencing a property key of the prototype
 * containing the decorated property. The first instance value assigned to this
 * `source` property is assigned as readonly on the instance and appended to the
 * supplied `handle`, thus creating an _instance-scoped handle_. This _scoped
 * handle_ is then used to create an Observable which is assigned as readonly to
 * the decorated property on the instance. This implies that the decorated
 * property will not be assigned an Observable until the referenced `source`
 * property is assigned an instance value.
 *
 * @param handle - Conduit handle.
 * @param source - Property key.
 * @returns Prototype property decorator.
 *
 * @example Subscribe to the `'io.github.sgrud.example'` conduit.
 * ```ts
 * import type { ConduitValue } from '@sgrud/bus';
 * import { Subscribe } from '@sgrud/bus';
 * import type { Observable } from 'rxjs';
 *
 * export class Subscriber {
 *
 *   @Subscribe('io.github.sgrud.example')
 *   public readonly conduit!: Observable<ConduitValue<any>>;
 *
 * }
 * ```
 *
 * @example Subscribe to the `'io.github.sgrud.example'` conduit.
 * ```ts
 * import type { ConduitValue } from '@sgrud/bus';
 * import { Subscribe } from '@sgrud/bus';
 * import type { Observable } from 'rxjs';
 *
 * export class Subscriber {
 *
 *   @Subscribe('io.github.sgrud', 'scope')
 *   public readonly conduit!: Observable<ConduitValue<any>>;
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
 * @see {@link ConduitHandler}
 * @see {@link Publish}
 */
export function Subscribe(
  handle: ConduitHandle,
  source?: string
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
              value: new ConduitHandler().get(`${handle}.${value}`)
            }
          });
        }
      });
    } else {
      Object.defineProperty(prototype, propertyKey, {
        enumerable: true,
        value: new ConduitHandler().get(handle)
      });
    }
  };

}
