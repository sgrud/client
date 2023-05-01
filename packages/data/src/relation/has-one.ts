import { assign, Mutable, TypeOf } from '@sgrud/core';
import { Model } from '../model/model';

/**
 * Unique symbol used as property key by the {@link HasOne} decorator to
 * register decorated {@link Model} fields for further computation, e.g.,
 * serialization, treemapping etc.
 *
 * @see {@link HasOne}
 */
export const hasOne = Symbol('@sgrud/data/model/has-one');

/**
 * {@link Model} field decorator factory. Using this decorator, {@link Model}s
 * can be enriched with one-to-one associations to other {@link Model}s. The
 * value for the `typeFactory` argument has to be another {@link Model}. By
 * applying this decorator, the decorated field will (depending on the
 * `transient` argument value) be taken into account when serializing or
 * treemapping the {@link Model} containing the decorated field.
 *
 * @param typeFactory - A forward reference to the field value constructor.
 * @param transient - Whether the decorated field is `transient`.
 * @typeParam T - The field value constructor type.
 * @returns A {@link Model} field decorator.
 *
 * @example
 * {@link Model} with a one-to-one association:
 * ```ts
 * import { HasOne, Model } from '@sgrud/data';
 * import { OwnedModel } from './owned-model';
 *
 * export class ExampleModel extends Model<ExampleModel> {
 *
 *   ⁠@HasOne(() => OwnedModel)
 *   public field?: OwnedModel;
 *
 *   protected [Symbol.toStringTag]: string = 'ExampleModel';
 *
 * }
 * ```
 *
 * @see {@link Model}
 * @see {@link HasMany}
 * @see {@link Property}
 */
export function HasOne<T extends Model.Type<Model>>(
  typeFactory: () => T,
  transient: boolean = false
) {

  /**
   * @param model - The {@link Model} to be decorated.
   * @param field - The {@link Model} `field` to be decorated.
   */
  return function<M extends Model>(
    model: M,
    field: Model.Field<M>
  ): void {
    const key = '#' + field as Model.Field<M>;

    if (!transient) {
      assign((model as Mutable<M>)[hasOne] ||= {}, {
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
