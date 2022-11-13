import { assign, Mutable, TypeOf } from '@sgrud/core';
import { Model } from '../model/model';

/**
 * Type alias for a union type of all primitive constructors which may be used
 * as `typeFactory` argument for the [Property][] decorator.
 *
 * [Property]: https://sgrud.github.io/client/functions/data.Property-1
 *
 * @see [Property][]
 */
export type Property =
  Model.Type<any> |
  typeof Boolean |
  typeof Date |
  typeof Number |
  typeof String;

/**
 * Unique symbol used as property key by the [Property][] decorator to register
 * decorated [Model][] fields for further computation, e.g., serialization,
 * treemapping etc.
 *
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 * [Property]: https://sgrud.github.io/client/functions/data.Property-1
 *
 * @see [Property][]
 */
export const property = Symbol('@sgrud/data/model/property');

// eslint-disable-next-line valid-jsdoc
/**
 * [Model][] field decorator factory. Using this decorator, [Model][]s can be
 * enriched with primitive fields. The compatible primitives are the subset of
 * primitives JavaScript shares with JSON, i.e., *Boolean*, *Date* (serialized),
 * *Number* and *String*. *Objects* cannot be uses as a `typeFactory` argument
 * value, as [Model][] fields containing objects should be declared by the
 * [HasOne][] and [HasMany][] [Model][] field decorators. By employing this
 * decorator, the decorated field will (depending on the `transient` argument
 * value) be taken into account when serializing or treemapping the [Model][]
 * containing the decorated field.
 *
 * [HasMany]: https://sgrud.github.io/client/functions/data.HasMany
 * [HasOne]: https://sgrud.github.io/client/functions/data.HasOne
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 *
 * @param typeFactory - Forward reference to the field value constructor.
 * @param transient - Whether the decorated field is transient.
 * @typeParam T - Field value constructor type.
 * @returns [Model][] field decorator.
 *
 * @example
 * [Model][] with a primitive field:
 * ```ts
 * import { Model, Property } from '@sgrud/data';
 *
 * export class ExampleModel extends Model<ExampleModel> {
 *
 *   ⁠@Property(() => String)
 *   public field?: string;
 *
 *   protected [Symbol.toStringTag]: string = 'ExampleModel';
 *
 * }
 * ```
 *
 * @see [Model][]
 * @see [HasOne][]
 * @see [HasMany][]
 */
export function Property<T extends Property>(
  typeFactory: () => T,
  transient: boolean = false
) {

  /**
   * @param model - Model to be decorated.
   * @param field - Model field to be decorated.
   */
  return function<M extends Model>(
    model: M,
    field: Model.Field<M>
  ): void {
    const key = '#' + field as Model.Field<M>;

    if (!transient) {
      assign((model as Mutable<M>)[property] ??= { }, {
        [field]: typeFactory
      });
    }

    Object.defineProperties(model, {
      [key]: {
        writable: true
      },
      [field]: {
        enumerable: true,
        get(this: M): InstanceType<T> | null | undefined {
          if (TypeOf.null(this[key])) return null;
          else return (this[key] as any)?.valueOf();
        },
        set(this: M, value?: any): void {
          if (TypeOf.null(value)) {
            (this[key] as unknown) = null;
          } else if (!TypeOf.undefined(value)) {
            (this[key] as unknown) = new (typeFactory())(value);
          } else return;

          this.changes.next(this);
        }
      }
    });
  };

}
