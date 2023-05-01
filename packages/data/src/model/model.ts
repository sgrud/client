import { assign, Linker, pluralize, Symbol, TypeOf } from '@sgrud/core';
import { BehaviorSubject, defer, first, identity, map, Observable, Subscribable, switchMap, tap, throwError } from 'rxjs';
import { Querier } from '../querier/querier';
import { hasMany } from '../relation/has-many';
import { hasOne } from '../relation/has-one';
import { property, Property } from '../relation/property';
import { Enum } from './enum';

/**
 * The **Model** namespace contains types and interfaces used and intended to be
 * used in conjunction with classes extending the abstract {@link Model} base
 * class. All the types and interfaces within this namespace are only applicable
 * to classes extending the abstract {@link Model} base class, as their generic
 * type argument is always constrained to this abstract base class.
 *
 * @see {@link Model}
 */
export namespace Model {
  /* eslint-disable @typescript-eslint/indent */

  /**
   * Type alias for all **Field**s, i.e., own enumerable properties (excluding
   * internally used ones), of classes extending the abstract {@link Model} base
   * class.
   *
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   */
  export type Field<T extends Model> = string &
    Exclude<keyof T, Exclude<keyof Model, 'uuid' | 'created' | 'modified'>>;

  /**
   * **Filter** type alias referencing the {@link Filter.Params} type.
   *
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   *
   * @see {@link Filter.Params}
   */
  export type Filter<T extends Model> = Filter.Params<T>;

  /**
   * Mapped type to compile strongly typed **Graph**s of classes extending the
   * abstract {@link Model} base class, while providing intellisense.
   *
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   */
  export type Graph<T extends Model> = {
    [K in Field<T>]?:
      Required<T>[K] extends (...args: any[]) => any
        ? never :
      Required<T>[K] extends Model<infer I> | Model<infer I>[]
        ? Record<K, Graph<I> | (() => Record<K, Graph<T>>)> :
      K;
  }[Field<T>][];

  /**
   * Mapped type to compile strongly typed property **Path**s of classes
   * extending the abstract {@link Model} base class, while providing
   * intellisense.
   *
   * @typeParam N - A string array type used to determine recursive depth.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   */
  export type Path<T extends Model, N extends string[] = []> = {
    [K in Field<T>]:
      N extends { length: 5 }
        ? never :
      Required<T>[K] extends (...args: any[]) => any
        ? never :
      Required<T>[K] extends Model<infer I> | Model<infer I>[]
        ? `${K}.${Path<I, [...N, string]>}` :
      K;
  }[Field<T>];

  /**
   * Mapped type to compile strongly typed **Shape**s of classes extending the
   * abstract {@link Model} base class, while providing intellisense.
   *
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   */
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

  /**
   * Interface describing the **Type**, i.e., static constructable context, of
   * classes extending the abstract {@link Model} base class.
   *
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   */
  export interface Type<T extends Model> extends Required<typeof Model> {

    /**
     * Overridden `prototype` signature.
     */
    readonly prototype: T;

    /**
     * Overridden and concretized constructor signature.
     *
     * @param args - The default class constructor rest parameter.
     */
    new(...args: ConstructorParameters<typeof Model>): T;

  }

  /* eslint-enable @typescript-eslint/indent */
}

/**
 * The **Filter** namespace contains types and interfaces to be used when
 * searching through the repositories of classes extending the abstract
 * {@link Model} base class. All the interfaces within this namespace are only
 * applicable to classes extending the abstract {@link Model} base class, as
 * their generic type argument is always constrained to this abstract base
 * class.
 *
 * @see {@link Model}
 */
export namespace Model.Filter {

  /**
   * Type alias for a string union type of all possible **Conjunction**s,
   * namely: `'AND'`, `'AND_NOT'`, `'OR'` and `'OR_NOT'`.
   */
  export type Conjunction =
    'AND' |
    'AND_NOT' |
    'OR' |
    'OR_NOT';

  /**
   * Type alias for a string union type of all possible **Operator**s, namely:
   * `'EQUAL'`, `'NOT_EQUAL'`, `'LIKE'`, `'GREATER_THAN'`, `'GREATER_OR_EQUAL'`,
   * `'LESS_THAN'` and `'LESS_OR_EQUAL'`.
   */
  export type Operator =
    'EQUAL' |
    'GREATER_OR_EQUAL' |
    'GREATER_THAN' |
    'LESS_OR_EQUAL' |
    'LESS_THAN' |
    'LIKE' |
    'NOT_EQUAL';

  /**
   * Interface describing the shape of an **Expression** which may be employed
   * through the {@link Params} as part of a {@link Model.findAll}.
   * **Expression**s can either be the plain shape of an {@link entity} or
   * compositions of multiple {@link conjunction}s.
   *
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   */
  export interface Expression<T extends Model> {

    /**
     * **conjunction** of multiple filter {@link Expression}s requested data
     * {@link Model}s are matched against. The **conjunction** sibling parameter
     * {@link entity} has to be undefined when supplying this parameter. By
     * supplying filter {@link Expression}s, conjunct by specific
     * {@link Conjunction} operators, fine-grained filter operations can be
     * compiled.
     */
    readonly conjunction?: {

      /**
       * List of {@link Expression}s which are logically combined through an
       * {@link operator}. These {@link Expression}s may be nested and can be
       * used to construct complex composite filter operations.
       */
      readonly operands: Expression<T>[];

      /**
       * {@link Conjunction} **operator** used to logically combine all supplied
       * {@link operands}.
       */
      readonly operator?: Conjunction;

    };

    /**
     * Shape the requested data {@link Model}s are matched against. Supplying
     * this parameter requires the {@link conjunction} sibling parameter to be
     * `undefined`. By specifying the **entity** shape to match data
     * {@link Model}s against, simple filter operations can be compiled.
     */
    readonly entity?: {

      /**
       * {@link Operator} to use for matching.
       */
      readonly operator?: Operator;

      /**
       * Property **path** from within the data {@link Model} which to match
       * against. The value which will be matched against has to be supplied
       * through the {@link value} property.
       */
      readonly path: Model.Path<T>;

      /**
       * Property **value** to match data {@link Model}s against. The property
       * path to this value has to be supplied through the {@link path}
       * property.
       */
      readonly value: unknown;

    };

  }

  /**
   * Interface describing the **Params** for the {@link Model.findAll} method.
   * This is the most relevant interface within this namespace (and is therefore
   * also referenced by the {@link Filter} type alias), as it describes the
   * input **Params** of any selective data retrieval.
   *
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   *
   * @see {@link Model}
   */
  export interface Params<T extends Model> {

    /**
     * Desired sorting **dir**ection of the requested data {@link Model}s. To
     * specify which field the results should be sorted by, the {@link sort}
     * property must be supplied.
     */
    readonly dir?: 'asc' | 'desc';

    /**
     * {@link Expression} to evaluate results against. This **expression** may
     * be a simple matching or more complex, conjunct and nested
     * **expression**s.
     */
    readonly expression?: Expression<T>;

    /**
     * **page** number, i.e., offset within the list of all results for a data
     * {@link Model} request. This property should be used together with the
     * page {@link size} property.
     */
    readonly page?: number;

    /**
     * Free-text **search** field. This field overrides all {@link expression}s,
     * as such that if this field contains a value, all {@link expression}s are
     * ignored and only this free-text **search** filter is applied.
     */
    readonly search?: string;

    /**
     * Page **size**, i.e., number of results which should be included within
     * the response to a data {@link Model} request. This property should be
     * used together with the {@link page} offset property.
     */
    readonly size?: number;

    /**
     * Property path used to determine the value which to **sort** the requested
     * data {@link Model}s by. This property should be used together with the
     * sorting {@link dir}ection property.
     */
    readonly sort?: Path<T>;

  }

  /**
   * Interface describing the shape of {@link Filter}ed **Results**. When
   * invoking the {@link Model.findAll} method, an {@link Observable} of this
   * interface shape is returned.
   */
  export interface Results<T extends Model> {

    /**
     * An array of {@link Model}s representing the {@link Filter}ed **results**.
     */
    result: T[];

    /**
     * The **total** number of {@link Results}, useful for the implementation of
     * a pageable representation of {@link Filter}ed {@link Results}.
     */
    total: number;

  }

}

/**
 * Abstract base class to implement data **Model**s. By extending this abstract
 * base class while providing the `Symbol.toStringTag` property containing the
 * singular name of the resulting data **Model**, type safe data handling, i.e.,
 * retrieval, mutation and storage, can easily be achieved. Through the use of
 * the static- and instance-scoped polymorphic `this`, all inherited operations
 * warrant type safety and provide intellisense.
 *
 * @typeParam M - The extending **Model** {@link InstanceType}.
 *
 * @example
 * Extend the **Model** base class:
 * ```ts
 * import { Model, Property } from '@sgrud/data';
 *
 * export class ExampleModel extends Model<ExampleModel> {
 *
 *   ⁠@Property(() => String)
 *   public field: string?;
 *
 *   protected [Symbol.toStringTag]: string = 'ExampleModel';
 *
 * }
 * ```
 *
 * @see {@link Querier}
 */
export abstract class Model<M extends Model = any> {

  /**
   * Static **commit** method. Calling this method on a class extending the
   * abstract {@link Model} base class, while supplying an `operation` and all
   * its embedded `variables`, will dispatch the {@link Querier.Operation} to
   * the respective {@link Model} repository through the highest priority
   * {@link Querier} or, if no {@link Querier} is compatible, an error is
   * thrown. This method is the entry point for all {@link Model}-related data
   * transferral and is internally called by all other distinct methods of the
   * {@link Model}.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param operation - The {@link Querier.Operation} to be **commit**ted.
   * @param variables - Any {@link Querier.Variables} within the `operation`.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the **commit**med `operation`.
   * @throws An {@link Observable} {@link ReferenceError} on incompatibility.
   *
   * @example
   * **commit** a `query`-type operation:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.commit(`query queryExample(variable: $variable) {
   *   result {
   *     field
   *   }
   * }`, {
   *   variable: 'value'
   * }).subscribe(console.log);
   * ```
   *
   */
  public static commit<T extends Model>(
    this: Model.Type<T>,
    operation: Querier.Operation,
    variables?: Querier.Variables
  ): Observable<unknown> {
    return defer(() => {
      const compatible = [];
      const queriers = new Linker<typeof Querier>().getAll(Querier);
      const type = operation.slice(0, operation.indexOf(' ')) as Querier.Type;

      for (const querier of queriers) {
        if (querier.types.has(type)) {
          compatible[querier.priority(this)] = querier;
        }
      }

      if (!compatible.length) {
        const { entity } = new this();
        return throwError(() => new ReferenceError(`${entity}.${type}`));
      }

      return compatible[compatible.length - 1].commit(
        operation.replace(/\s*(\W)\s*/g, '$1') as Querier.Operation,
        variables
      );
    });
  }

  /**
   * Static **deleteAll** method. Calling this method on a class extending the
   * {@link Model}, while supplying an array of `uuids`, will dispatch the
   * deletion of all {@link Model} instances identified by these UUIDs to the
   * respective {@link Model} repository by internally calling {@link commit}
   * with suitable arguments. Through this method, bulk-deletions from the
   * respective {@link Model} repository can be achieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param uuids - An array of `uuids` of {@link Model}s to be deleted.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the deletion.
   *
   * @example
   * Drop all model instances by UUIDs:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.deleteAll([
   *   'b050d63f-cede-46dd-8634-a80d0563ead8',
   *   'a0164132-cd9b-4859-927e-ba68bc20c0ae',
   *   'b3fca31e-95cd-453a-93ae-969d3b120712'
   * ]).subscribe(console.log);
   * ```
   */
  public static deleteAll<T extends Model>(
    this: Model.Type<T>,
    uuids: string[]
  ): Observable<unknown> {
    const { plural } = new this();

    return this.commit(`mutation deleteAll($uuids: [String]!) {
      delete${plural}(ids: $uuids)
    }`, { uuids });
  }

  /**
   * Static **deleteOne** method. Calling this method on a class extending the
   * {@link Model}, while supplying an `uuid`, will dispatch the deletion of the
   * {@link Model} instance identified by this UUID to the respective repository
   * by internally calling the {@link commit} operation with suitable arguments.
   * Through this method, the deletion of a single {@link Model} instance from
   * the respective {@link Model} repository can be achieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param uuid - The `uuid` of the {@link Model} instance to be deleted.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the deletion.
   *
   * @example
   * Drop one model instance by UUID:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.deleteOne(
   *   '18f3aa99-afa5-40f4-90c2-71a2ecc25651'
   * ).subscribe(console.log);
   * ```
   */
  public static deleteOne<T extends Model>(
    this: Model.Type<T>,
    uuid: string
  ): Observable<unknown> {
    const { entity } = new this();

    return this.commit(`mutation deleteOne($uuid: String!) {
      delete${entity}(id: $uuid)
    }`, { uuid });
  }

  /**
   * Static **findAll** method. Calling this method on a class extending the
   * abstract {@link Model} base class, while supplying a `filter` to match
   * {@link Model} instances by and a `graph` containing the fields to be
   * included in the result, will dispatch a lookup operation to the respective
   * repository by internally calling the {@link commit} operation with suitable
   * arguments. Through this method, the bulk-lookup of {@link Model} instances
   * from the respective {@link Model} repository can be achieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param filter - A {@link Model.Filter} to find {@link Model} instances by.
   * @param graph - A {@link Model.Graph} of fields to be returned.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the find operation.
   *
   * @example
   * Lookup all UUIDs for model instances modified between two dates:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.findAll({
   *   expression: {
   *     conjunction: {
   *       operands: [
   *         {
   *           entity: {
   *             operator: 'GREATER_OR_EQUAL',
   *             path: 'modified',
   *             value: new Date('2021-01-01')
   *           }
   *         },
   *         {
   *           entity: {
   *             operator: 'LESS_OR_EQUAL',
   *             path: 'modified',
   *             value: new Date('2021-12-12')
   *           }
   *         }
   *       ],
   *       operator: 'AND'
   *     }
   *   }
   * }, [
   *   'uuid',
   *   'field'
   * ]).subscribe(console.log);
   * ```
   */
  public static findAll<T extends Model>(
    this: Model.Type<T>,
    filter: Model.Filter<T>,
    graph: Model.Graph<T>
  ): Observable<Model.Filter.Results<T>> {
    const { plural } = new this();

    return this.commit(`query findAll($filter: FilterSortPaginateInput!) {
      get${plural}(params: $filter) {
        result ${this.unravel(graph)}
        total
      }
    }`, { filter }).pipe(map((data: any) => {
      const value = data[`get${plural}`] as Model.Filter.Results<T>;
      value.result = value.result.map((i) => new this(i));
      return value;
    }));
  }

  /**
   * Static **findOne** method. Calling this method on a class extending the
   * abstract {@link Model} base class, while supplying the `shape` to match the
   * {@link Model} instance by and a `graph` describing the fields to be
   * included in the result, will dispatch the lookup operation to the
   * respective repository by internally calling the {@link commit} operation
   * with suitable arguments. Through this method, the retrieval of one specific
   * {@link Model} instance from the respective {@link Model} repository can be
   * achieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param shape - The {@link Model.Shape} of instance to find.
   * @param graph - A {@link Model.Graph} of fields to be returned.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the find operation.
   *
   * @example
   * Lookup one model instance by UUID:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.findOne({
   *   id: '2cfe7609-c4d9-4e4f-9a8b-ad72737db48a'
   * }, [
   *   'uuid',
   *   'modified',
   *   'field'
   * ]).subscribe(console.log);
   * ```
   */
  public static findOne<T extends Model>(
    this: Model.Type<T>,
    shape: Model.Shape<T>,
    graph: Model.Graph<T>
  ): Observable<T> {
    const { entity, type } = new this();

    return this.commit(`query findOne($shape: ${type}Input!) {
      get${entity}(entity: $shape) ${this.unravel(graph)}
    }`, { shape }).pipe(map((data: any) => {
      const value = data[`get${entity}`] as T;
      return new this(value);
    }));
  }

  /**
   * Static **saveAll** method. Calling this method on a class extending the
   * abstract {@link Model} base class, while supplying a list of `models` which
   * to save and a `graph` describing the fields to be returned in the result,
   * will dispatch the save operation to the respective {@link Model} repository
   * by internally calling the {@link commit} operation with suitable arguments.
   * Through this method, bulk-persistance of {@link Model} instances from the
   * respective {@link Model} repository can be achieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param models - An array of {@link Model}s to be saved.
   * @param graph - The {@link Model.Graph} of fields to be returned.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the save operation.
   *
   * @example
   * Persist multiple {@link Model}s:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.saveAll([
   *   new ExampleModel({ field: 'example_1' }),
   *   new ExampleModel({ field: 'example_2' }),
   *   new ExampleModel({ field: 'example_3' })
   * ], [
   *   'uuid',
   *   'modified',
   *   'field'
   * ]).subscribe(console.log);
   * ```
   */
  public static saveAll<T extends Model>(
    this: Model.Type<T>,
    models: T[],
    graph: Model.Graph<T>
  ): Observable<T[]> {
    const { plural, type } = new this();

    return this.commit(`mutation saveAll($models: [${type}Input]!) {
      save${plural}(entities: $models) ${this.unravel(graph)}
    }`, { models: models.map((i) => i.serialize()) }).pipe(map((data: any) => {
      const value = data[`save${plural}`].result as T[];
      return value.map((i) => new this(i));
    }));
  }

  /**
   * Static **saveOne** method. Calling this method on a class extending the
   * abstract {@link Model} base class, while supplying a `model` which to save
   * and a `graph` describing the fields to be returned in the result, will
   * dispatch the save operation to the respective {@link Model} repository by
   * internally calling the {@link commit} operation with suitable arguments.
   * Through this method, persistance of one specific {@link Model} instance
   * from the respective {@link Model} repository can be achieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param model - The {@link Model} which is to be saved.
   * @param graph - A {@link Model.Graph} of fields to be returned.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the save operation.
   *
   * @example
   * Persist a model:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.saveOne(new ExampleModel({ field: 'example' }), [
   *   'uuid',
   *   'modified',
   *   'field'
   * ]).subscribe(console.log);
   * ```
   */
  public static saveOne<T extends Model>(
    this: Model.Type<T>,
    model: T,
    graph: Model.Graph<T>
  ): Observable<T> {
    const { entity, type } = new this();

    return this.commit(`mutation saveOne($model: ${type}Input!) {
      save${entity}(entity: $model) ${this.unravel(graph)}
    }`, { model: model.serialize() }).pipe(map((data: any) => {
      const value = data[`save${entity}`] as T;
      return new this(value);
    }));
  }

  /**
   * Static **serialize** method. Calling this method on a class extending the
   * {@link Model}, while supplying a `model` which to **serialize** and
   * optionally enabling `shallow` serialization, will return the **serialize**d
   * {@link Model.Shape} of the {@link Model}, i.e., a plain JSON representation
   * of all {@link Model} fields, or `undefined`, if the supplied `model` does
   * not contain any fields or values. By serializing `shallow`ly, only such
   * properties defined on the supplied `model` are included (which means, all
   * one-to-one and one-to-many associations are ignored). Through this method,
   * the serialization of one specific {@link Model} instance from the
   * respective {@link Model} repository can be achieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param model - The {@link Model} which is to be **serialize**d.
   * @param shallow - Whether to **serialize** the {@link Model} `shallow`ly.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns The {@link Model.Shape} of the {@link Model} or `undefined`.
   *
   * @example
   * **serialize** a model:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   * const shape = ExampleModel.serialize(model);
   * console.log(shape); // { field: 'example' }
   * ```
   */
  public static serialize<T extends Model>(
    this: Model.Type<T>,
    model: T,
    shallow: boolean = false
  ): Model.Shape<T> | undefined {
    const data = {} as Model.Shape<T>;

    if (shallow && model.uuid) {
      data.uuid = this.valuate(model, 'uuid' as Model.Field<T>) as any;
    } else {
      for (const key in this.prototype[property]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          data[key] = this.valuate(model, key);
        }
      }
    }

    if (!shallow) {
      for (const key in this.prototype[hasMany]) {
        if (TypeOf.null(model[key as Model.Field<T>])) {
          data[key as Model.Field<T>] = null!;
        } else if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          data[key] = model[key].map((i) => i.serialize(shallow));
        }
      }

      for (const key in this.prototype[hasOne]) {
        if (TypeOf.null(model[key as Model.Field<T>])) {
          data[key as Model.Field<T>] = null!;
        } else if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          data[key] = model[key].serialize(shallow);
        }
      }
    }

    return Object.keys(data).length ? data : undefined;
  }

  /**
   * Static **treemap** method. Calling this method on a class extending the
   * abstract {@link Model} base class, while supplying a `model` which to
   * **treemap** and optionally enabling `shallow` **treemap**ping, will return
   * a {@link Model.Graph} describing the fields which are declared and defined
   * on the supplied `model`, or `undefined`, if the supplied `model` does not
   * contain any fields or values. By **treemap**ping `shallow`ly, only
   * properties defined on the supplied `model` are included (which means, all
   * one-to-one and one-to-many associations are ignored). Through this method,
   * the {@link Model.Graph} for one specific {@link Model} instance from the
   * respective {@link Model} repository can be retrieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param model - The {@link Model} which is to be **treemap**ped.
   * @param shallow - Whether to **treemap** the {@link Model} `shallow`ly.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns The {@link Model.Graph} of the {@link Model} or `undefined`.
   *
   * @example
   * **treemap** a {@link Model}:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   * const graph = ExampleModel.treemap(model);
   * console.log(graph); // ['field']
   * ```
   */
  public static treemap<T extends Model>(
    this: Model.Type<T>,
    model: T,
    shallow: boolean = false
  ): Model.Graph<T> | undefined {
    const graph = [] as Model.Graph<T>;

    for (const key in this.prototype[property]) {
      if (!TypeOf.undefined(model[key as Model.Field<T>])) {
        // @ts-expect-error type casting nightmare
        graph.push(key);
      }
    }

    if (!shallow) {
      for (const key in this.prototype[hasMany]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          graph.push({ [key]: (model[key].reduce((arr, i) => {
            return arr.concat(...i.treemap(shallow));
          }, []) as unknown[]).filter((value, i, arr) => {
            return arr.indexOf(value) === i;
          }) });
        }
      }

      for (const key in this.prototype[hasOne]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          graph.push({ [key]: model[key].treemap(shallow) });
        }
      }
    }

    return graph;
  }

  /**
   * Static **unravel** method. Calling this method on a class extending the
   * abstract {@link Model} base class, while supplying a `graph` describing the
   * fields which to **unravel**, will return the {@link Model.Graph} as raw
   * string. Through this method, the {@link Model.Graph} for one specific
   * {@link Model} instance from the respective {@link Model} repository can be
   * **unravel**ed into a raw string. This **unravel**ed {@link Model.Graph} can
   * then be consumed by, e.g., the {@link commit} method.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param graph - A {@link Model.Graph} which is to be **unravel**ed.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns The **unravel**ed {@link Model.Graph} as raw string.
   *
   * @example
   * **unravel** a {@link Model.Graph}:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const unraveled = ExampleModel.unravel([
   *   'uuid',
   *   'modified',
   *   'field'
   * ]);
   *
   * console.log(unraveled); // '{id modified field}'
   * ```
   */
  public static unravel<T extends Model>(
    this: Model.Type<T>,
    graph: Model.Graph<T>
  ): string {
    let result = '{';

    for (let i = 0; i < graph.length; i++) {
      if (i > 0) result += ' ';
      let node = graph[i] as any;

      if (TypeOf.object(node)) {
        for (const key in node) {
          node = node[key];

          if (TypeOf.array(node) && node.length) {
            result += key + this.unravel(node as Model.Graph<any>);
          } else if (TypeOf.function(node)) {
            const { [key]: sub, ...vars } = node();
            const keys = Object.keys(vars);
            result += key + '(';

            for (let j = 0; j < keys.length; j++) {
              if (TypeOf.undefined(vars[keys[j]])) {
                keys.splice(j--, 1);
              } else {
                const value = vars[keys[j]] instanceof Enum
                  ? vars[keys[j]].toString()
                  : JSON.stringify(vars[keys[j]]);

                if (j > 0) result += ' ';
                result += keys[j] + ':' + value;
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

  /**
   * Static **valuate** method. Calling this method on a class extending the
   * abstract {@link Model} base class, while supplying a `model` and a `field`
   * which to **valuate**, will return the preprocessed value (e.g., primitive
   * representation of JavaScript Dates) of the supplied `field` of the supplied
   * `model`. Through this method, the preprocessed `field` value of one
   * specific {@link Model} instance from the respective {@link Model}
   * repository can be retrieved.
   *
   * @param this - The explicit static polymorphic `this` parameter.
   * @param model - The {@link Model} which is to be **valuate**d.
   * @param field - A {@link Model.Field} to be **valuate**d.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns The **valuate**d `field` value.
   *
   * @example
   * **valuate** a `field`:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ created: new Date(0) });
   * const value = ExampleModel.valuate(model, 'created');
   * console.log(value); // '1970-01-01T00:00:00.000+00:00'
   * ```
   */
  public static valuate<T extends Model>(
    this: Model.Type<T>,
    model: T,
    field: Model.Field<T>
  ): unknown {
    const value = model['#' + field as Model.Field<T>];

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

  /**
   * Enforced well-known `Symbol.toStringTag` property containing the singular
   * name of this {@link Model}. The value of this property represents the
   * repository which all instances of this {@link Model} are considered to
   * belong to. In detail, the different operations {@link commit}ted through
   * this {@link Model} are derived from this singular name (and the
   * corresponding {@link pluralize}d form).
   *
   * @example
   * Provide a valid symbol property:
   * ```ts
   * import { Model } from '@sgrud/data';
   *
   * export class ExampleModel extends Model<ExampleModel> {
   *
   *   protected [Symbol.toStringTag]: string = 'ExampleModel';
   *
   * }
   * ```
   */
  protected abstract readonly [Symbol.toStringTag]: string;

  /**
   * {@link hasOne} symbol property used by the {@link HasOne} decorator.
   */
  public readonly [hasOne]?: Record<keyof M, () => unknown>;

  /**
   * {@link hasMany} symbol property used by the {@link HasMany} decorator.
   */
  public readonly [hasMany]?: Record<keyof M, () => unknown>;

  /**
   * {@link property} symbol property used by the {@link Property} decorator.
   */
  public readonly [property]?: Record<keyof M, () => unknown>;

  /**
   * [UUID](https://www.ietf.org/rfc/rfc4122) of this {@link Model} instance.
   *
   * @decorator {@link Property}
   */
  @Property(() => String)
  public uuid?: string;

  /**
   * Transient creation {@link Date} of this {@link Model} instance.
   *
   * @decorator {@link Property}
   */
  @Property(() => Date, true)
  public created?: Date;

  /**
   * Transient modification {@link Date} of this {@link Model} instance.
   *
   * @decorator {@link Property}
   */
  @Property(() => Date, true)
  public modified?: Date;

  /**
   * {@link BehaviorSubject} emitting every time this {@link Model} instance
   * experiences **changes**.
   */
  protected readonly changes: BehaviorSubject<M>;

  /**
   * Type-asserted alias for the **static** {@link Model} context.
   */
  protected readonly static: Model.Type<M>;

  /**
   * Accessor to the singular name of this {@link Model}.
   *
   * @returns The singular name of this {@link Model}.
   */
  protected get entity(): string {
    return this.type.endsWith('Entity') ? this.type.slice(0, -6) : this.type;
  }

  /**
   * Accessor to the **plural**ized name of this {@link Model}.
   *
   * @returns The **plural**ized name of this {@link Model}.
   */
  protected get plural(): string {
    return pluralize(this.entity);
  }

  /**
   * Accessor to the raw name of this {@link Model}.
   *
   * @returns The raw name of this {@link Model}.
   */
  protected get type(): string {
    return this[Symbol.toStringTag];
  }

  /**
   * Public **constructor**. The **constructor** of all classes extending the
   * abstract {@link Model} base class, unless explicitly overridden, behaves
   * analogous to the instance-scoped {@link assign} method, as it takes all
   * supplied `parts` and {@link assign}s them to the instantiated and returned
   * {@link Model}. The **constructor** furthermore wires some internal
   * functionality, e.g., creates a new {@link changes} {@link BehaviorSubject}
   * which emits every mutation this {@link Model} instance experiences etc.
   *
   * @param parts - An array of `parts` to {@link assign}.
   */
  public constructor(...parts: Model.Shape<M>[]) {
    this.static = this.constructor as Model.Type<M>;
    this.changes = new BehaviorSubject<M>(this as Model as M);
    (this as Model as M).assign(...parts).subscribe();
  }

  /**
   * Well-known `Symbol.observable` method returning a {@link Subscribable}. The
   * returned {@link Subscribable} emits all {@link changes} this {@link Model}
   * instance experiences.
   *
   * @returns A {@link Subscribable} emitting all {@link Model} {@link changes}.
   *
   * @example
   * Subscribe to a {@link Model} instance:
   * ```ts
   * import { from } from 'rxjs';
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel();
   * from(model).subscribe(console.log);
   * ```
   */
  public [Symbol.observable](): Subscribable<M> {
    return this.changes.asObservable();
  }

  /**
   * Instance-scoped **assign** method. Calling this method, while supplying a
   * list of `parts`, will **assign** all supplied `parts` to the {@link Model}
   * instance. The **assign**ment is implemented as deep merge **assign**ment.
   * Using this method, an existing {@link Model} instance can easily be mutated
   * while still emitting the mutated {@link changes}.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @param parts - An array of `parts` to **assign** to this {@link Model}.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the mutated instance.
   *
   * @example
   * **assign** `parts` to a {@link Model} instance:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel();
   * model.assign({ field: 'example' }).subscribe(console.log);
   * ```
   */
  public assign<T extends Model = M>(
    this: T,
    ...parts: Model.Shape<T>[]
  ): Observable<T> {
    return new Observable((observer) => {
      this.changes.next(assign(this, ...parts));
      this.changes.pipe(first()).subscribe(observer);
    });
  }

  /**
   * Instance-scoped **clear** method. Calling this method on an instance of a
   * class extending the abstract {@link Model} base class, while optionally
   * supplying a list of `keys` which are to be **clear**ed, will set the value
   * of the properties described by either the supplied `keys` or, if no `keys`
   * were supplied, all enumerable properties of the class extending the
   * abstract {@link Model} base class to `undefined`, effectively **clear**ing
   * them.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @param keys - An optional array of `keys` to **clear**.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the mutated instance.
   *
   * @example
   * **clear** a {@link Model} instance selectively:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   * model.clear(['field']).subscribe(console.log);
   * ```
   */
  public clear<T extends Model = M>(
    this: T,
    keys?: Model.Field<T>[]
  ): Observable<T> {
    return defer(() => {
      const shape = {} as Model.Shape<T>;

      if (!keys?.length) {
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
    });
  }

  /**
   * Instance-scoped **commit** method. Internally calls the {@link commit}
   * method on the static `this`-context of an instance of a class extending the
   * abstract {@link Model} base class and furthermore {@link assign}s the
   * returned data to the {@link Model} instance the **commit** method was
   * called upon. When supplying a `mapping`, the returned data will be mutated
   * through the supplied `mapping` (otherwise this `mapping` defaults to
   * {@link identity}).
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @param operation - The {@link Querier.Operation} to be **commit**ted.
   * @param variables - Any {@link Querier.Variables} within the `operation`.
   * @param mapping - An optional mutation to apply to the returned data.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the mutated instance.
   *
   * @example
   * **commit** a `query`-type operation:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel();
   *
   * model.commit(`query queryExample(variable: $variable) {
   *   result {
   *     field
   *   }
   * }`, {
   *   variable: 'value'
   * }).subscribe(console.log);
   * ```
   */
  public commit<T extends Model = M>(
    this: T,
    operation: Querier.Operation,
    variables?: Querier.Variables,
    mapping: (next: unknown) => Model.Shape<T> = identity as any
  ): Observable<T> {
    return this.static.commit<T>(operation, variables).pipe(
      map(mapping),
      switchMap((model) => this.assign(model))
    );
  }

  /**
   * Instance-scoped **delete** method. Internally calls the static
   * {@link deleteOne} method while supplying the UUID of this instance of a
   * class extending the abstract {@link Model} base class. Calling this method
   * furthermore {@link clear}s the {@link Model} instance and finalizes its
   * deletion by completing the internal {@link changes} {@link BehaviorSubject}
   * of the {@link Model} instance the **delete** method was called upon.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the mutated instance.
   *
   * @example
   * **delete** a {@link Model} instance by UUID:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({
   *   id: '3068b30e-82cd-44c5-8912-db13724816fd'
   * });
   *
   * model.delete().subscribe(console.log);
   * ```
   */
  public delete<T extends Model = M>(this: T): Observable<T> {
    return this.static.deleteOne<T>(this.uuid!).pipe(
      switchMap(() => this.clear()),
      tap(() => this.changes.complete())
    );
  }

  /**
   * Instance-scoped **find** method. Internally calls the {@link findOne}
   * method on the static `this`-context of an instance of a class extending the
   * abstract {@link Model} base class and then {@link assign}s the returned
   * data to the {@link Model} instance the **find** method was called upon.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @param graph - A {@link Model.Graph} of fields to be returned.
   * @param shape - The {@link Model.Shape} of the {@link Model} to find.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the mutated instance.
   *
   * @example
   * **find** a {@link Model} instance by UUID:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({
   *   id: '3068b30e-82cd-44c5-8912-db13724816fd'
   * });
   *
   * model.find([
   *   'uuid',
   *   'modified',
   *   'field'
   * ]).subscribe(console.log);
   * ```
   */
  public find<T extends Model = M>(
    this: T,
    graph: Model.Graph<T>,
    shape: Model.Shape<T> = this.serialize(true)!
  ): Observable<T> {
    return this.static.findOne<T>(shape, graph).pipe(
      switchMap((model) => this.assign(model as Model.Shape<T>))
    );
  }

  /**
   * Instance-scoped **save** method. Internally calls the {@link saveOne}
   * method on the static `this`-context of an instance of a class extending the
   * abstract {@link Model} base class and then {@link assign}s the returned
   * data to the {@link Model} instance the **save** method was called upon.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @param graph - A {@link Model.Graph} of fields to be returned.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns An {@link Observable} of the mutated instance.
   *
   * @example
   * **save** a {@link Model} instance:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   *
   * model.save([
   *   'uuid',
   *   'modified',
   *   'field'
   * ]).subscribe(console.log);
   * ```
   */
  public save<T extends Model = M>(
    this: T,
    graph: Model.Graph<T> = this.treemap()!
  ): Observable<T> {
    return this.static.saveOne<T>(this, graph).pipe(
      switchMap((model) => this.assign(model as Model.Shape<T>))
    );
  }

  /**
   * Instance-scoped **serialize**er. Internally calls the {@link serialize}
   * method on the static `this`-context of an instance of a class extending the
   * abstract {@link Model} base class.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @param shallow - Whether to **serialize** `shallow`ly.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns The {@link Model.Shape} of this instance or `undefined`.
   *
   * @example
   * **serialize** a {@link Model} instance:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   * console.log(model.serialize()); // { field: 'example' }
   * ```
   */
  public serialize<T extends Model = M>(
    this: T,
    shallow: boolean = false
  ): Model.Shape<T> | undefined {
    return this.static.serialize<T>(this, shallow);
  }

  /**
   * Instance-scoped **treemap** method. Internally calls the {@link treemap}
   * method on the static `this`-context of an instance of a class extending the
   * abstract {@link Model} base class.
   *
   * @param this - The explicit polymorphic `this` parameter.
   * @param shallow - Whether to **treemap** `shallow`ly.
   * @typeParam T - The extending {@link Model} {@link InstanceType}.
   * @returns A {@link Model.Graph} of this instance or undefined.
   *
   * @example
   * **treemap** a {@link Model} instance:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   * console.log(model.treemap()); // ['field']
   * ```
   */
  public treemap<T extends Model = M>(
    this: T,
    shallow: boolean = false
  ): Model.Graph<T> | undefined {
    return this.static.treemap<T>(this, shallow);
  }

}
