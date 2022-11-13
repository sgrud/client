import { assign, Mutable, TypeOf } from '@sgrud/core';
import { Model } from '../model/model';

/**
 * Unique symbol used as property key by the [HasOne][] decorator to register
 * decorated [Model][] fields for further computation, e.g., serialization,
 * treemapping etc.
 *
 * [HasOne]: https://sgrud.github.io/client/functions/data.HasOne
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 *
 * @see [HasOne][]
 */
export const hasOne = Symbol('@sgrud/data/model/has-one');

/**
 * [Model][] field decorator factory. Using this decorator, [Model][]s can be
 * enriched with one-to-one associations to other [Model][]s. The value for the
 * `typeFactory` argument has to be another [Model][]. By applying this
 * decorator, the decorated field will (depending on the `transient` argument
 * value) be taken into account when serializing or treemapping the [Model][]
 * containing the decorated field.
 *
 * [HasMany]: https://sgrud.github.io/client/functions/data.HasMany
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 * [Property]: https://sgrud.github.io/client/functions/data.Property-1
 *
 * @param typeFactory - Forward reference to the field value constructor.
 * @param transient - Whether the decorated field is transient.
 * @typeParam T - Field value constructor type.
 * @returns [Model][] field decorator.
 *
 * @example
 * [Model][] with a one-to-one association:
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
 * @see [Model][]
 * @see [HasMany][]
 * @see [Property][]
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
