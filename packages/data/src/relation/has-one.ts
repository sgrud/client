import { assign, Mutable, TypeOf } from '@sgrud/core';
import { Model } from '../model/model';

/**
 * Symbol used as property key by the {@link HasOne} decorator to register
 * decorated fields for further computation, e.g., serialization, treemapping
 * etc.
 *
 * @see {@link HasOne}
 */
export const hasOne = Symbol('@sgrud/data/model/has-one');

/**
 * {@link Model} field decorator factory. Using this decorator, Models can be
 * enriched with one-to-one associations to other Models. Any argument for the
 * `typeFactory` has to be another Model. By applying this decorator, the
 * decorated field will (depending on the `transient` argument) be recognized
 * when serializing or treemapping the Model containing the decorated field.
 *
 * @param typeFactory - Forward reference to the field value constructor.
 * @param transient - Whether the decorated field is transient.
 * @typeParam T - Field value constructor type.
 * @returns Model field decorator.
 *
 * @example Model with a has one association.
 * ```ts
 * import { HasOne, Model } from '@sgrud/data';
 * import { OwnedModel } from './owned-model';
 *
 * export class ExampleModel extends Model<ExampleModel> {
 *
 *   @HasOne(() => OwnedModel)
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
export function HasOne<T extends Model.Type<any>>(
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
      assign((model as Mutable<M>)[hasOne] ||= { }, {
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
