import { assign, TypeOf } from '@sgrud/core';
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
  typeof String;

/**
 * Symbol used as property key by the {@link Property} decorator to register
 * decorated fields for further computation, e.g., serialization, treemapping
 * etc.
 *
 * @see {@link Property}
 */
export const property = Symbol('@sgrud/data/model/property');

// eslint-disable-next-line valid-jsdoc
/**
 * {@link Model} field decorator factory. Using this decorator, Models can be
 * enriched with primitive fields. The compatible primitives are the subset of
 * primitives JavaScript shares with JSON, i.e., `Boolean`, `Date` (in
 * serialized form), `Number` and `String`. The `Object` primitive cannot be
 * uses as a `typeFactory`, as Model fields containing objects are declared by
 * the {@link HasOne} and {@link HasMany} Model field decorators. By employing
 * this decorator, the decorated field will (depending on the `transient`
 * argument) be recognized when serializing or treemapping the Model containing
 * the decorated field.
 *
 * @param typeFactory - Forward reference to the field value constructor.
 * @param transient - Whether the decorated field is transient.
 * @typeParam T - Field value constructor type.
 * @returns Model field decorator.
 *
 * @example Model with a string type field.
 * ```ts
 * import type { Model } from '@sgrud/data';
 * import { Property } from '@sgrud/data';
 * import { Provider } from '@sgrud/core';
 *
 * export class ExampleModel {
 *   extends Provider<typeof Model>('sgrud.data.model.Model') {
 *
 *   @Property(() => String)
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
   * @param model - Model to be decorated.
   * @param field - Model field to be decorated.
   */
  return function<M extends Model>(
    model: M,
    field: Model.Field<M>
  ): void {
    const key = '#' + field as Model.Field<M>;

    if (!transient) {
      assign(model[property] ??= { }, {
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
            (this[key] as unknown) = value;
          } else if (!TypeOf.undefined(value)) {
            (this[key] as unknown) = new (typeFactory())(value);
          } else return;

          this.changes.next(this);
        }
      }
    });
  };

}
