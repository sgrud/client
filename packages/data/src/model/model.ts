import { assign, Linker, pluralize, Target, TypeOf } from '@sgrud/utils';
import { BehaviorSubject, finalize, identity, map, Observable, of, OperatorFunction, switchMap, throwError } from 'rxjs';
import { Query } from '../query/query';
import { hasMany } from '../relation/has-many';
import { hasOne } from '../relation/has-one';
import { property, Property } from '../relation/property';
import { Enum } from './enum';

export namespace Model {
  /* eslint-disable @typescript-eslint/indent */

  export type Field<T extends Model> = string &
    Exclude<keyof T, Exclude<keyof Model, 'id' | 'created' | 'modified'>>;

  export type Graph<T extends Model> = {
    [K in Field<T>]?:
      Required<T>[K] extends (...args: any[]) => any
        ? never :
      Required<T>[K] extends Model<infer I> | Model<infer I>[]
        ? Record<K, Graph<I> | (() => Record<K, Graph<T>>)> :
      K;
  }[Field<T>][];

  export type Path<T extends Model, S extends string[] = []> = {
    [K in Field<T>]:
      S extends { length: 5 }
        ? never :
      Required<T>[K] extends (...args: any[]) => any
        ? never :
      Required<T>[K] extends Model<infer I> | Model<infer I>[]
        ? `${K}.${Path<I, [...S, string]>}` :
      K;
  }[Field<T>];

  export type Shape<T extends Model> = {
    [K in Field<T>]?:
      Required<T>[K] extends (...args: any[]) => any
        ? never :
      Required<T>[K] extends Model<infer I>
        ? Shape<I> :
      Required<T>[K] extends Model<infer I>[]
        ? Shape<I>[] :
      Required<T>[K];
  };

  export type Type<T extends Model> = Required<typeof Model> &
    (new (...args: ConstructorParameters<typeof Model>) => T);

  /* eslint-enable @typescript-eslint/indent */
}

export abstract class Model<M extends Model = any> {

  public static commit<T extends Model>(
    this: Model.Type<T>,
    operation: Query.Value,
    variables: Record<string, unknown> = { }
  ): Observable<any> {
    const compatible = [];
    const linker = new Linker<Target<Query>, Query>();
    const pool = linker.getAll(Query as Target<Query>);
    const type = operation.substr(0, operation.indexOf(' '));

    if (!pool.length) {
      return throwError(() => new RangeError());
    } else for (const query of pool) {
      if (query.types.has(type as Query.Type)) {
        compatible[query.priority(this)] = query;
      }
    }

    return compatible[compatible.length - 1].commit(
      operation.replace(/\s*(\W)\s*/g, '$1') as Query.Value,
      variables
    );
  }

  public static deleteAll<T extends Model>(
    this: Model.Type<T>,
    ...ids: string[]
  ): Observable<any> {
    const { plural } = new this();

    return this.commit(`mutation deleteAll($ids: [String]!) {
      delete${plural}(ids: $ids)
    }`, { ids });
  }

  public static deleteOne<T extends Model>(
    this: Model.Type<T>,
    id: string
  ): Observable<any> {
    const { entity } = new this();

    return this.commit(`mutation deleteOne($id: String!) {
      delete${entity}(id: $id)
    }`, { id });
  }

  public static findAll<T extends Model>(
    this: Model.Type<T>,
    filter: Query.Filter<T>,
    graph: Model.Graph<T>
  ): Observable<{ result?: T[]; total?: number }> {
    const { plural } = new this();

    return this.commit(`query findAll($filter: FilterSortPaginateInput!) {
      get${plural}(params: $filter) {
        result ${this.unravel(graph)}
        total
      }
    }`, { filter }).pipe(map((data) => {
      const value = data[`get${plural}`] as { result?: T[]; total?: number };
      value.result = value.result?.map((i) => new this(i));
      return value;
    }));
  }

  public static findOne<T extends Model>(
    this: Model.Type<T>,
    shape: Model.Shape<T>,
    graph: Model.Graph<T>
  ): Observable<T> {
    const { entity, type } = new this();

    return this.commit(`query findOne($shape: ${type}Input!) {
      get${entity}(entity: $shape) ${this.unravel(graph)}
    }`, { shape }).pipe(map((data) => {
      const value = data[`get${entity}`] as T;
      return new this(value);
    }));
  }

  public static saveAll<T extends Model>(
    this: Model.Type<T>,
    models: T[],
    graph: Model.Graph<T>
  ): Observable<T[]> {
    const { plural, type } = new this();

    return this.commit(`mutation saveAll($models: [${type}Input]!) {
      save${plural}(entities: $models) ${this.unravel(graph)}
    }`, { models: models.map((i) => i.serialize()) }).pipe(map((data) => {
      const value = data[`save${plural}`].result as T[];
      return value.map((i) => new this(i));
    }));
  }

  public static saveOne<T extends Model>(
    this: Model.Type<T>,
    model: T,
    graph: Model.Graph<T>
  ): Observable<T> {
    const { entity, type } = new this();

    return this.commit(`mutation saveOne($model: ${type}Input!) {
      save${entity}(entity: $model) ${this.unravel(graph)}
    }`, { model: model.serialize() }).pipe(map((data) => {
      const value = data[`save${entity}`] as T;
      return new this(value);
    }));
  }

  public static serialize<T extends Model>(
    this: Model.Type<T>,
    model: T,
    shallow: boolean = false
  ): Model.Shape<T> | undefined {
    const data = { } as Model.Shape<T>;

    if (shallow && model.id) {
      data.id = this.valuate(model, 'id' as Model.Field<T>);
    } else {
      for (const key in (this.prototype as Model)[property]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          data[key] = this.valuate(model, key);
        }
      }
    }

    if (!shallow) {
      for (const key in (this.prototype as Model)[hasMany]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          data[key] = model[key].map((i) => i.serialize(shallow));
        }
      }

      for (const key in (this.prototype as Model)[hasOne]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          data[key] = model[key].serialize(shallow);
        }
      }
    }

    return Object.keys(data).length ? data : undefined;
  }

  public static treemap<T extends Model>(
    this: Model.Type<T>,
    model: T,
    shallow: boolean = false
  ): Model.Graph<T> | undefined {
    const graph = [] as Model.Graph<T>;

    for (const key in (this.prototype as Model)[property]) {
      if (!TypeOf.undefined(model[key as Model.Field<T>])) {
        // @ts-expect-error type casting nightmare
        graph.push(key);
      }
    }

    if (!shallow) {
      for (const key in (this.prototype as Model)[hasMany]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          graph.push({ [key]: (model[key].reduce((arr, i) => {
            return arr.concat(...i.treemap(shallow));
          }, []) as unknown[]).filter((value, i, arr) => {
            return arr.indexOf(value) === i;
          }) });
        }
      }

      for (const key in (this.prototype as Model)[hasOne]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          graph.push({ [key]: model[key].treemap(shallow) });
        }
      }
    }

    return graph;
  }

  public static unravel<T extends Model>(
    this: Model.Type<T>,
    graph: Model.Graph<T>
  ): string {
    let result = '{';

    for (let n = 0; n < graph.length; n++) {
      if (n > 0) result += ' ';
      let node = graph[n] as any;

      if (TypeOf.object(node)) {
        for (const key in node) {
          node = node[key];

          if (TypeOf.array(node) && node.length > 0) {
            result += key + this.unravel(node);
          } else if (TypeOf.function(node)) {
            const { [key]: sub, ...vars } = node();
            const keys = Object.keys(vars);
            result += key + '(';

            for (let m = 0; m < keys.length; m++) {
              if (TypeOf.undefined(vars[keys[m]])) {
                keys.splice(m--, 1);
              } else {
                const value = vars[keys[m]] instanceof Enum
                  ? vars[keys[m]] as string
                  : JSON.stringify(vars[keys[m]]);

                if (m > 0) result += ' ';
                result += keys[m] + ':' + value;
              }
            }

            result += ')' + this.unravel(sub);
          }
        }
      } else if (TypeOf.string(node)) {
        result += node;
      }
    }

    return result + '}';
  }

  public static valuate<T extends Model>(
    this: Model.Type<T>,
    model: T,
    propertyKey: Model.Field<T>
  ): any {
    const value = model['#' + propertyKey as Model.Field<T>] as unknown;

    if (TypeOf.null(value)) {
      return null;
    } else if (TypeOf.boolean(value)) {
      return value.valueOf();
    } else if (TypeOf.date(value)) {
      const offset = value.getTimezoneOffset();
      return value.toISOString().slice(0, -1) + (offset <= 0 ? '+' : '-')
        + String(Math.floor(Math.abs(offset / 60))).padStart(2, '0') + ':'
        + String(Math.floor(Math.abs(offset % 60))).padStart(2, '0');
    } else if (TypeOf.number(value)) {
      return value.valueOf();
    } else if (TypeOf.string(value)) {
      return value.toString();
    }

    return undefined;
  }

  protected abstract readonly [Symbol.toStringTag]: string;

  @Property(() => String)
  public id?: string;

  @Property(() => Date, false)
  public created?: Date;

  @Property(() => Date, false)
  public modified?: Date;

  protected readonly changes!: BehaviorSubject<M>;

  private [hasOne]: Record<keyof M, () => unknown>;

  private [hasMany]: Record<keyof M, () => unknown>;

  private [property]: Record<keyof M, () => unknown>;

  private readonly static: Model.Type<M>;

  public get value(): Observable<M> {
    return this.changes.asObservable();
  }

  private get entity(): string {
    return this.type.endsWith('Entity') ? this.type.slice(0, -6) : this.type;
  }

  private get plural(): string {
    return pluralize(this.entity);
  }

  private get type(): string {
    return this[Symbol.toStringTag];
  }

  public constructor(...parts: Model.Shape<M>[]) {
    this.changes = new BehaviorSubject<M>(this as Model as M);
    this.static = this.constructor as Model['static'];
    (this as Model as M).assign(...parts).subscribe();
  }

  public assign<T extends Model = M>(
    this: T,
    ...parts: Model.Shape<T>[]
  ): Observable<T> {
    return of(assign(this, ...parts)).pipe(
      finalize(() => this.changes.next(this))
    );
  }

  public clear<T extends Model = M>(
    this: T,
    ...keys: Model.Field<T>[]
  ): Observable<T> {
    const shape = { } as Model.Shape<T>;

    if (!keys.length) {
      keys = Object.keys(this) as Model.Field<T>[];

      for (const key of keys) {
        if (key.startsWith('#')) {
          shape[key] = undefined;
        }
      }
    } else {
      for (const key of keys) {
        shape['#' + key as Model.Field<T>] = undefined;
      }
    }

    return this.assign(shape);
  }

  public commit<T extends Model = M>(
    this: T,
    operation: Query.Value,
    variables: Record<string, unknown> = { },
    mapping: OperatorFunction<any, T> = identity
  ): Observable<T> {
    return this.static.commit<T>(operation, variables).pipe(
      mapping, switchMap((model) => this.assign(model as Model.Shape<T>))
    );
  }

  public delete<T extends Model = M>(
    this: T
  ): Observable<T> {
    return this.static.deleteOne<T>(this.id!).pipe(
      switchMap(() => this.clear()), finalize(() => this.changes.complete())
    );
  }

  public find<T extends Model = M>(
    this: T,
    graph: Model.Graph<T>,
    shape: Model.Shape<T> = this.serialize(true)!
  ): Observable<T> {
    return this.static.findOne<T>(shape, graph).pipe(
      switchMap((model) => this.assign(model as Model.Shape<T>))
    );
  }

  public save<T extends Model = M>(
    this: T,
    graph: Model.Graph<T> = this.treemap()!
  ): Observable<T> {
    return this.static.saveOne<T>(this, graph).pipe(
      switchMap((model) => this.assign(model as Model.Shape<T>))
    );
  }

  public serialize<T extends Model = M>(
    this: T,
    shallow: boolean = false
  ): Model.Shape<T> | undefined {
    return this.static.serialize<T>(this, shallow);
  }

  public treemap<T extends Model = M>(
    this: T,
    shallow: boolean = false
  ): Model.Graph<T> | undefined {
    return this.static.treemap<T>(this, shallow);
  }

}
