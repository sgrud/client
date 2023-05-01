import { assign, Mutable, TypeOf } from '@sgrud/core';
import { Model } from '../model/model';

/**
 * Type alias for a union type of all primitive constructors which may be used
 * as `typeFactory` argument for the {@link Property} decorator.
 *
 * @see {@link Property}
 */
export type Property =
  typeof Boolean |
  typeof Date |
  typeof Number |
  typeof Object |
  typeof String;

/**
 * Unique symbol used as property key by the {@link Property} decorator to
 * register decorated {@link Model} fields for further computation, e.g.,
 * serialization, treemapping etc.
 *
 * @see {@link Property}
 */
export const property = Symbol('@sgrud/data/model/property');

/**
 * {@link Model} field decorator factory. Using this decorator, {@link Model}s
 * can be enriched with primitive fields. The compatible primitives are the
 * subset of primitives JavaScript shares with JSON, i.e., {@link Boolean},
 * {@link Date} (serialized), {@link Number} and {@link String}. {@link Object}s
 * cannot be uses as a `typeFactory` argument value, as {@link Model} fields
 * containing objects should be declared by the {@link HasOne} and
 * {@link HasMany} decorators. By employing this decorator, the decorated field
 * will (depending on the `transient` argument value) be taken into account when
 * serializing or treemapping the {@link Model} containing the decorated field.
 *
 * @param typeFactory - A forward reference to the field value constructor.
 * @param transient - Whether the decorated field is `transient`.
 * @typeParam T - The field value constructor type.
 * @returns A {@link Model} field decorator.
 *
 * @example
 * {@link Model} with a primitive field:
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
 * @see {@link Model}
 * @see {@link HasOne}
 * @see {@link HasMany}
 */
export function Property<T extends Property>(
  typeFactory: () => T,
  transient: boolean = false
) {

  /**
   * @param model - The {@link Model} to be decorated.
   * @param field - The {@link Model} `field` to be decorated.
   */
  return function<M extends Model>(model: M, field: Model.Field<M>): void {
    const key = '#' + field as Model.Field<M>;

    if (!transient) {
      assign((model as Mutable<M>)[property] ||= {}, {
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
          else return this[key]?.valueOf() as InstanceType<T>;
        },
        set(this: M, value?: InstanceType<T>): void {
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
