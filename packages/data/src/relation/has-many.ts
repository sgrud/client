import { TypeOf } from '@sgrud/utils';
import { Model } from '../model/model';

export const hasMany = Symbol('@sgrud/data/model/has-many');

export function HasMany<T extends Model.Type<any>>(
  typeFactory: () => T,
  serialize: boolean = true
) {

  return function<M extends Model>(
    prototype: M,
    propertyKey: Model.Field<M>
  ): void {
    const key = '#' + propertyKey as Model.Field<M>;

    if (serialize) {
      prototype[hasMany] = {
        ...prototype[hasMany],
        [propertyKey]: typeFactory
      };
    }

    Object.defineProperties(prototype, {
      [key]: {
        writable: true
      },
      [propertyKey]: {
        enumerable: true,
        get(this: M): InstanceType<T>[] | null | undefined {
          if (TypeOf.null(this[key])) return null;
          else return (this[key] as any)?.slice();
        },
        set(this: M, value?: any[]): void {
          if (TypeOf.null(value)) {
            (this[key] as unknown) = value;
          } else if (!TypeOf.undefined(value)) {
            (this[key] as unknown) = value.map((i) => new (typeFactory())(i));
          } else return;

          this.changes.next(this);
        }
      }
    });
  };

}
