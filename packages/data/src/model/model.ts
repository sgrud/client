import { assign, Linker, pluralize, TypeOf } from '@sgrud/core';
import { BehaviorSubject, identity, map, observable, Observable, of, Subscribable, switchMap, tap, throwError } from 'rxjs';
import { Querier } from '../querier/querier';
import { hasMany } from '../relation/has-many';
import { hasOne } from '../relation/has-one';
import { property, Property } from '../relation/property';
import { Enum } from './enum';

/**
 * Namespace containing types and interfaces used and intended to be used in
 * conjunction with classes extending the abstract [Model][] base class. All the
 * types and interfaces within this namespace are only applicable to classes
 * extending the abstract [Model][] base class, as their generic type argument
 * is always constrained to this abstract base class.
 *
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 *
 * @see [Model][]
 */
export namespace Model {
  /* eslint-disable @typescript-eslint/indent */

  /**
   * Type alias for all **Field**s, i.e., own enumerable properties, (excluding
   * internally used ones) of classes extending the abstract [Model][] base
   * class.
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   *
   * @typeParam T - Extending *Model* instance type.
   */
  export type Field<T extends Model> = string &
    Exclude<keyof T, Exclude<keyof Model, 'id' | 'created' | 'modified'>>;

  /**
   * Type alias referencing **Filter** [Params][].
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   * [Params]: https://sgrud.github.io/client/interfaces/data.Model-1.Filter-1.Params
   *
   * @typeParam T - Extending *Model* instance type.
   *
   * @see [Params][]
   */
  export type Filter<T extends Model> = Filter.Params<T>;

  /**
   * Mapped type to compile strongly typed **Graph**s of classes extending the
   * abstract [Model][] base class, while providing intellisense.
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   *
   * @typeParam T - Extending *Model* instance type.
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
   * extending the abstract [Model][] base class, while providing intellisense.
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   *
   * @typeParam T - Extending *Model* instance type.
   * @typeParam S - String array type.
   */
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

  /**
   * Mapped type to compile strongly typed **Shape**s of classes extending the
   * abstract [Model][] base class, while providing intellisense.
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   *
   * @typeParam T - Extending *Model* instance type.
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
   * classes extending the abstract [Model][] base class.
   *
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   *
   * @typeParam T - Extending *Model* instance type.
   */
  export interface Type<T extends Model> extends Required<typeof Model> {

    /**
     * Overridden and concretized constructor signature.
     *
     * @param args - Class constructor rest parameter.
     */
    new (...args: ConstructorParameters<typeof Model>): T;

  }

  /* eslint-enable @typescript-eslint/indent */
}

/**
 * Namespace containing types and interfaces to be used when searching through
 * the repositories of classes extending the abstract [Model][] base class. All
 * the interfaces within this namespace are only applicable to classes extending
 * the abstract [Model][] base class, as their generic type argument is always
 * constrained to this abstract base class.
 *
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 *
 * @see [Model][]
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
   * through the [Params][] as part of a *findAll* invocation of the [Model][].
   * **Expression**s can either be the plain shape of an *entity* or
   * compositions of multiple filter expressions, conjunct by one of the
   * [Conjunction][]s.
   *
   * [Conjunction]: https://sgrud.github.io/client/types/data.Model-1.Filter-1.Conjunction
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   * [Params]: https://sgrud.github.io/client/interfaces/data.Model-1.Filter-1.Params
   *
   * @typeParam T - Extending *Model* instance type.
   */
  export interface Expression<T extends Model> {

    /**
     * **Conjunction** of multiple filter expressions requested data [Model][]s
     * are matched against. The *conjunction* sibling parameter has to be
     * undefined when supplying this parameter. By supplying filter expressions,
     * conjunct by specific [Conjunction][] operators, fine-grained filter
     * operations can be compiled.
     *
     * [Conjunction]: https://sgrud.github.io/client/types/data.Model-1.Filter-1.Conjunction
     * [Model]: https://sgrud.github.io/client/classes/data.Model
     */
    readonly conjunction?: {

      /**
       * List of expressions which are logically combined through an *operator*.
       * These expressions may be nested and can be used to construct complex
       * composite filter operations.
       */
      readonly operands: Expression<T>[];

      /**
       * [Conjunction][] **operator** used to logically combine all supplied
       * *operands*.
       *
       * [Conjunction]: https://sgrud.github.io/client/types/data.Model-1.Filter-1.Conjunction
       */
      readonly operator?: Conjunction;

    };

    /**
     * Shape the requested data [Model][]s are matched against. Supplying this
     * parameter requires the *conjunction* sibling parameter to be undefined.
     * By specifying the **entity** shape to match data [Model][]s against,
     * simple filter operations can be compiled.
     *
     * [Model]: https://sgrud.github.io/client/classes/data.Model
     */
    readonly entity?: {

      /**
       * [Operator][] to use for matching.
       *
       * [Operator]: https://sgrud.github.io/client/types/data.Model-1.Filter-1.Operator
       */
      readonly operator?: Operator;

      /**
       * Property **path** from within the data [Model][] which to match
       * against. The value which will be matched against has to be supplied
       * through the *value* property.
       *
       * [Model]: https://sgrud.github.io/client/classes/data.Model
       */
      readonly path: Model.Path<T>;

      /**
       * Property **value** to match data [Model][]s against. The property path
       * of this value has to be supplied through the *path* property.
       *
       * [Model]: https://sgrud.github.io/client/classes/data.Model
       */
      readonly value: unknown;

    };

  }

  /**
   * Interface describing the **Params** of, e.g., the [Model][] *findAll*
   * method. This is the most relevant interface within this namespace (and is
   * therefore also referenced by the [Filter][] type alias), as it describes
   * the input **Params** of any selective data retrieval.
   *
   * [Filter]: https://sgrud.github.io/client/types/data.Model-1.Filter
   * [Model]: https://sgrud.github.io/client/classes/data.Model
   *
   * @typeParam T - Extending *Model* instance type.
   *
   * @see [Model][]
   */
  export interface Params<T extends Model> {

    /**
     * Desired sorting **dir**ection of the requested data [Model][]s. To
     * specify which field the results should be sorted by, the *sort* property
     * must be supplied.
     *
     * [Model]: https://sgrud.github.io/client/classes/data.Model
     */
    readonly dir?: 'asc' | 'desc';

    /**
     * **Expression** to evaluate results against. This **expression** may be a
     * simple matching or more complex, conjunct and nested **expression**s.
     */
    readonly expression?: Expression<T>;

    /**
     * **Page** number, i.e., offset within the list of all results for a data
     * [Model][] request. This property should be used together with the page
     * *size* property.
     *
     * [Model]: https://sgrud.github.io/client/classes/data.Model
     */
    readonly page?: number;

    /**
     * Free-text **search** field. This field overrides all *expression*s, as
     * such that if this field contains a value, all *expression*s are ignored
     * and only this free-text **search** filter is applied.
     */
    readonly search?: string;

    /**
     * Page **size**, i.e., number of results which should be included within
     * the response to a data [Model][] request. This property should be used
     * together with the *page* offset property.
     *
     * [Model]: https://sgrud.github.io/client/classes/data.Model
     */
    readonly size?: number;

    /**
     * Property path used to determine the value which to **sort** the requested
     * data [Model][]s by. This property should be used together with the
     * sorting *dir*ection property.
     *
     * [Model]: https://sgrud.github.io/client/classes/data.Model
     */
    readonly sort?: Path<T>;

  }

}

/**
 * Abstract base class to implement data **Model**s. By extending this abstract
 * base class while providing the enforced symbol property containing the
 * singular name of the resulting data **Model**, type safe data handling, i.e.,
 * retrieval, mutation and storage, can easily be achieved. Through the use of
 * the static- and instance-scoped polymorphic `this`, all inherited operations
 * warrant type safety and provide intellisense.
 *
 * [Querier]: https://sgrud.github.io/client/classes/data.Querier
 *
 * @typeParam M - Extending *Model* instance type.
 *
 * @example
 * Extend the *Model* base class:
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
 * @see [Querier][]
 */
export abstract class Model<M extends Model = any> {

  /**
   * Static **commit** method. Calling this method on a class extending the
   * abstract *Model* base class, while supplying an `operation` and all its
   * embedded `variables`, will dispatch the supplied [Operation][] to the
   * respective *Model* repository through the highest priority [Querier][] or,
   * if no [Querier][] is compatible, throw an error. This method is the central
   * point of origin for all *Model*-related data transferral and is internally
   * called by all other distinct methods of the *Model*.
   *
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Operation]: https://sgrud.github.io/client/types/data.Querier-1.Operation
   * [Querier]: https://sgrud.github.io/client/classes/data.Querier
   * [Variables]: https://sgrud.github.io/client/interfaces/data.Querier-1.Variables
   *
   * @param this - Static polymorphic `this`.
   * @param operation - [Operation][] to **commit**.
   * @param variables - [Variables][] within the `operation`.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the **commit**ment.
   * @throws [Observable][] of ReferenceError.
   *
   * @example
   * **Commit** a `query`-type operation:
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
  ): Observable<any> {
    const compatible = [];
    const queriers = new Linker<typeof Querier>().getAll(Querier);
    const type = operation.slice(0, operation.indexOf(' '));

    for (const querier of queriers) {
      if (querier.types.has(type as Querier.Type)) {
        compatible[querier.priority(this)] = querier;
      }
    }

    if (!compatible.length) {
      const { entity } = new this();
      return throwError(() => new ReferenceError(`${type}:${entity}`));
    }

    return compatible[compatible.length - 1].commit(
      operation.replace(/\s*(\W)\s*/g, '$1') as Querier.Operation,
      variables
    );
  }

  /**
   * Static **deleteAll** method. Calling this method on a class extending the
   * *Model*, while supplying a list of `uuids`, will dispatch the deletion of
   * all *Model* instances identified by these UUIDs to the respective *Model*
   * repository by internally calling the *commit* operation with suitable
   * arguments. Through this method, bulk-deletions from the respective *Model*
   * repository can be achieved.
   *
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Static polymorphic `this`.
   * @param uuids - UUIDs of *Model* instances to be deleted.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the deletion.
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
  ): Observable<any> {
    const { plural } = new this();

    return this.commit(`mutation deleteAll($uuids: [String]!) {
      delete${plural}(ids: $uuids)
    }`, { uuids });
  }

  /**
   * Static **deleteOne** method. Calling this method on a class extending the
   * *Model*, while supplying an `uuid`, will dispatch the deletion of the
   * *Model* instance identified by this UUID to the respective *Model*
   * repository by internally calling the *commit* operation with suitable
   * arguments. Through this method, the deletion of a single *Model* instance
   * from the respective *Model* repository can be achieved.
   *
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Static polymorphic `this`.
   * @param uuid - UUID of the *Model* instance to be deleted.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the deletion.
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
  ): Observable<any> {
    const { entity } = new this();

    return this.commit(`mutation deleteOne($uuid: String!) {
      delete${entity}(id: $uuid)
    }`, { uuid });
  }

  /**
   * Static **findAll** method. Calling this method on a class extending the
   * abstract *Model* base class, while supplying a `filter` to match *Model*
   * instances by and a `graph` containing the fields to be included in the
   * result, will dispatch a lookup operation to the respective *Model*
   * repository by internally calling the *commit* operation with suitable
   * arguments. Through this method, the bulk-lookup of *Model* instances from
   * the respective *Model* repository can be achieved.
   *
   * [Filter]: https://sgrud.github.io/client/types/data.Model-1.Filter
   * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Static polymorphic `this`.
   * @param filter - [Filter][] to find *Model* instances by.
   * @param graph - [Graph][] of fields to be included.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the find operation.
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
   *   'id',
   *   'field'
   * ]).subscribe(console.log);
   * ```
   */
  public static findAll<T extends Model>(
    this: Model.Type<T>,
    filter: Model.Filter<T>,
    graph: Model.Graph<T>
  ): Observable<{ result: T[]; total: number }> {
    const { plural } = new this();

    return this.commit(`query findAll($filter: FilterSortPaginateInput!) {
      get${plural}(params: $filter) {
        result ${this.unravel(graph)}
        total
      }
    }`, { filter }).pipe(map((data) => {
      const value = data[`get${plural}`] as { result: T[]; total: number };
      value.result = value.result.map((i) => new this(i));
      return value;
    }));
  }

  /**
   * Static **findOne** method. Calling this method on a class extending the
   * abstract *Model* base class, while supplying the `shape` to match the
   * *Model* instance by and a `graph` describing the fields to be included in
   * the result, will dispatch the lookup operation to the respective *Model*
   * repository by internally calling the *commit* operation with suitable
   * arguments. Through this method, the retrieval of one specific *Model*
   * instance from the respective *Model* repository can be achieved.
   *
   * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Shape]: https://sgrud.github.io/client/types/data.Model-1.Shape
   *
   * @param this - Static polymorphic `this`.
   * @param shape - [Shape][] of the *Model* instance to find.
   * @param graph - [Graph][] of fields to be included.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the find operation.
   *
   * @example
   * Lookup one model instance by UUID:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.findOne({
   *   id: '2cfe7609-c4d9-4e4f-9a8b-ad72737db48a'
   * }, [
   *   'id',
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
    }`, { shape }).pipe(map((data) => {
      const value = data[`get${entity}`] as T;
      return new this(value);
    }));
  }

  /**
   * Static **saveAll** method. Calling this method on a class extending the
   * abstract *Model* base class, while supplying a list of `models` which to
   * save and a `graph` describing the fields to be included in the result, will
   * dispatch the save operation to the respective *Model* repository by
   * internally calling the *commit* operation with suitable arguments. Through
   * this method, bulk-persistance of *Model* instances from the respective
   * *Model* repository can be achieved.
   *
   * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Static polymorphic `this`.
   * @param models - Array of *Model*s to be saved.
   * @param graph - [Graph][] of fields to be included.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the save operation.
   *
   * @example
   * Persist multiple *Model*s:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.saveAll([
   *   new ExampleModel({ field: 'example_1' }),
   *   new ExampleModel({ field: 'example_2' }),
   *   new ExampleModel({ field: 'example_3' })
   * ], [
   *   'id',
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
    }`, { models: models.map((i) => i.serialize()) }).pipe(map((data) => {
      const value = data[`save${plural}`].result as T[];
      return value.map((i) => new this(i));
    }));
  }

  /**
   * Static **saveOne** method. Calling this method on a class extending the
   * abstract *Model* base class, while supplying a `model` which to save and a
   * `graph` describing the fields to be included in the result, will dispatch
   * the save operation to the respective *Model* repository by internally
   * calling the *commit* operation with suitable arguments. Through this
   * method, persistance of one specific *Model* instance from the respective
   * *Model* repository can be achieved.
   *
   * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Static polymorphic `this`.
   * @param model - *Model* which is to be saved.
   * @param graph - [Graph][] of fields to be included.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the save operation.
   *
   * @example
   * Persist a model:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * ExampleModel.saveOne(new ExampleModel({ field: 'example' }), [
   *   'id',
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
    }`, { model: model.serialize() }).pipe(map((data) => {
      const value = data[`save${entity}`] as T;
      return new this(value);
    }));
  }

  /**
   * Static **serialize** method. Calling this method on a class extending the
   * *Model*, while supplying a `model` which to **serialize** and optionally
   * enabling `shallow` serialization, will return the [Shape][] of the *Model*,
   * i.e., a plain JSON representation of all *Model* fields, or undefined, if
   * the supplied `model` does not contain any fields or values. By serializing
   * `shallow`ly, only properties defined on the supplied `model` are included
   * (which means, all one-to-one and one-to-many associations are ignored).
   * Through this method, the serialization of one specific *Model* instance
   * from the respective *Model* repository can be achieved.
   *
   * [Shape]: https://sgrud.github.io/client/types/data.Model-1.Shape
   *
   * @param this - Static polymorphic `this`.
   * @param model - *Model* which is to be **serialize**d.
   * @param shallow - Whether to **serialize** shallowly.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Shape][] of the *Model* or undefined.
   *
   * @example
   * **Serialize** a model:
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
    const data = { } as Model.Shape<T>;

    if (shallow && model.id) {
      data.id = this.valuate(model, 'id' as Model.Field<T>);
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
   * abstract *Model* base class, while supplying a `model` which to **treemap**
   * and optionally enabling `shallow` **treemap**ping, will return a [Graph][]
   * describing the fields which are declared and defined on the supplied
   * `model`, or undefined, if the supplied `model` does not contain any fields
   * or values. By **treemap**ping `shallow`ly, only properties defined on the
   * supplied `model` are included (which means, all one-to-one and one-to-many
   * associations are ignored). Through this method, the [Graph][] for one
   * specific *Model* instance from the respective *Model* repository can be
   * retrieved.
   *
   * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
   *
   * @param this - Static polymorphic `this`.
   * @param model - *Model* which is to be **treemap**ped.
   * @param shallow - Whether to **treemap** shallowly.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Graph][] of the *Model* or undefined.
   *
   * @example
   * **Treemap** a *Model*:
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
   * abstract *Model* base class, while supplying a `graph` describing the
   * fields which to **unravel**, will return the **unravel**ed [Graph][] as raw
   * string. Through this method, the [Graph][] for one specific *Model*
   * instance from the respective *Model* repository can be **unravel**ed into a
   * raw string. This **unravel**ed [Graph][] can then be consumed by, e.g., the
   * *commit* method.
   *
   * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
   *
   * @param this - Static polymorphic `this`.
   * @param graph - [Graph][] which is to be **unravel**ed.
   * @typeParam T - Extending *Model* instance type.
   * @returns **Unravel**ed [Graph][] as raw string.
   *
   * @example
   * **Unravel** a [Graph][]:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const unraveled = ExampleModel.unravel([
   *   'id',
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

          if (TypeOf.array(node) && node.length > 0) {
            result += key + this.unravel(node);
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
   * abstract *Model* base class, while supplying a `model` and a `field` which
   * to **valuate**, will return the preprocessed value (e.g., primitive
   * representation of JavaScript Dates) of the supplied `field` of the supplied
   * `model`. Through this method, the preprocessed `field` value of one
   * specific *Model* instance from the respective *Model* repository can be
   * retrieved.
   *
   * [Field]: https://sgrud.github.io/client/types/data.Model-1.Field
   *
   * @param this - Static polymorphic `this`.
   * @param model - *Model* which is to be **valuate**d.
   * @param field - [Field][] of the *Model* to be **valuate**d.
   * @typeParam T - Extending *Model* instance type.
   * @returns Valuated `field` value.
   *
   * @example
   * **Valuate** a `field`:
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
  ): any {
    const value = model['#' + field as Model.Field<T>] as unknown;

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
   * Enforced symbol property containing the singular name of this *Model*. The
   * value of this property represents the repository which all instances of
   * this *Model* are considered to belong to. In Detail, the different
   * operations *commit*ted through this *Model* are derived from this singular
   * name (and the corresponding [pluralize][]d form).
   *
   * [pluralize]: http://127.0.0.1:8080/docs/functions/core.pluralize
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
   * Symbol property used by the [HasOne][] decorator.
   *
   * [HasOne]: http://127.0.0.1:8080/docs/functions/data.HasOne
   */
  public readonly [hasOne]?: Record<keyof M, () => unknown>;

  /**
   * Symbol property used by the [HasMany][] decorator.
   *
   * [HasMany]: http://127.0.0.1:8080/docs/functions/data.HasMany
   */
  public readonly [hasMany]?: Record<keyof M, () => unknown>;

  /**
   * Symbol property used by the [Property][] decorator.
   *
   * [Property]: http://127.0.0.1:8080/docs/functions/data.Property-1
   */
  public readonly [property]?: Record<keyof M, () => unknown>;

  /**
   * Symbol property typed as callback to a [Subscribable][]. The returned
   * [Subscribable][] emits every mutation this *Model* instance experiences.
   *
   * [Subscribable]: https://rxjs.dev/api/index/interface/Subscribable
   *
   * @returns Callback to a [Subscribable][].
   *
   * @example
   * Subscribe to a *Model* instance:
   * ```ts
   * import { from } from 'rxjs';
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel();
   * from(model).subscribe(console.log);
   * ```
   */
  public readonly [Symbol.observable]!: () => Subscribable<M>;

  /**
   * Universally unique identifier of this *Model* instance.
   */
  @Property(() => String)
  public id?: string;

  /**
   * Transient creation date of this *Model* instance.
   */
  @Property(() => Date, true)
  public created?: Date;

  /**
   * Transient modification date of this *Model* instance.
   */
  @Property(() => Date, true)
  public modified?: Date;

  /**
   * [BehaviorSubject][] emitting every time this *Model* instance experiences
   * **changes**.
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   */
  protected readonly changes: BehaviorSubject<M>;

  /**
   * Type-asserted alias for the **static** *Model* context.
   */
  protected readonly static: Model.Type<M>;

  /**
   * [observable][] interop getter returning a callback to a [Subscribable][].
   *
   * [observable]: https://rxjs.dev/api/index/const/observable
   * [Subscribable]: https://rxjs.dev/api/index/interface/Subscribable
   */
  public get [observable](): () => Subscribable<M> {
    return () => this.changes.asObservable();
  }

  /**
   * Accessor to the singular name of this *Model*.
   *
   * @returns Singular name of this *Model*.
   */
  protected get entity(): string {
    return this.type.endsWith('Entity') ? this.type.slice(0, -6) : this.type;
  }

  /**
   * Accessor to the **plural**ized name of this *Model*.
   *
   * @returns **Plural**ized name of this *Model*.
   */
  protected get plural(): string {
    return pluralize(this.entity);
  }

  /**
   * Accessor to the raw name of this *Model*.
   *
   * @returns Raw name of this *Model*.
   */
  protected get type(): string {
    return this[Symbol.toStringTag];
  }

  /**
   * Public **constructor**. The **constructor** of all classes extending the
   * abstract *Model* base class, unless explicitly overridden, behaves
   * analogous to the instance-scoped *assign* method, as it takes all supplied
   * `parts` and assigns them to the instantiated and returned *Model*. The
   * **constructor** furthermore wires some internal functionality, e.g.,
   * creates a new *changes* [BehaviorSubject][] which emits every mutation this
   * *Model* instance experiences.
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   *
   * @param parts - Array of parts to assign.
   */
  public constructor(...parts: Model.Shape<M>[]) {
    this.static = this.constructor as Model.Type<M>;
    this.changes = new BehaviorSubject<M>(this as Model as M);
    (this as Model as M).assign(...parts).subscribe();
  }

  /**
   * Instance-scoped **assign** method. Calling this method, while supplying a
   * list of `parts`, will **assign** all supplied `parts` to the *Model*
   * instance. The **assign**ment is implemented as deep merge **assign**ment.
   * Using this method, an existing *Model* instance can easily be mutated while
   * still emitting the mutated *changes*.
   *
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Polymorphic `this`.
   * @param parts - Array of parts to **assign**.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the mutated instance.
   *
   * @example
   * **Assign** `parts` to a *Model* instance:
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
    return of(assign(this, ...parts)).pipe(
      tap(() => this.changes.next(this))
    );
  }

  /**
   * Instance-scoped **clear** method. Calling this method on an instance of a
   * class extending the abstract *Model* base class, while optionally supplying
   * a list of `keys` which are to be **clear**ed, will set the value of the
   * properties described by either the supplied `keys` or, if no `keys` were
   * supplied, all enumerable properties of the class extending the abstract
   * *Model* base class to undefined, effectively **clear**ing them.
   *
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Polymorphic `this`.
   * @param keys - Optional array of keys to **clear**.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the mutated instance.
   *
   * @example
   * **Clear** a *Model* instance selectively:
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
    const shape = { } as Model.Shape<T>;

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
  }

  /**
   * Instance-scoped **commit** method. Internally calls the static *commit*
   * method on the `this`-context of an instance of a class extending the
   * abstract *Model* base class and furthermore *assign*s the returned data to
   * the *Model* instance the **commit** method was called upon. When supplying
   * a `mapping`, the returned data will be mutated through the supplied
   * `mapping` (otherwise this `mapping` defaults to [identity][]).
   *
   * [identity]: https://rxjs.dev/api/index/function/identity
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Operation]: https://sgrud.github.io/client/types/data.Querier-1.Operation
   * [Variables]: https://sgrud.github.io/client/interfaces/data.Querier-1.Variables
   *
   * @param this - Polymorphic `this`.
   * @param operation - [Operation][] to **commit**.
   * @param variables - [Variables][] within the `operation`.
   * @param mapping - Mutation to apply.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the mutated instance.
   *
   * @example
   * Commit a `query`-type operation:
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
    mapping: (response: any) => Model.Shape<T> = identity
  ): Observable<T> {
    return this.static.commit<T>(operation, variables).pipe(
      map(mapping),
      switchMap((model) => this.assign(model))
    );
  }

  /**
   * Instance-scoped **delete** method. Internally calls the static *deleteOne*
   * method while supplying the UUID of this instance of a class extending the
   * abstract *Model* base class. Calling this method furthermore *clear*s the
   * *Model* instance and completes its deletion by calling complete on the
   * internal *changes* [BehaviorSubject][] of the *Model* instance the
   * **delete** method was called upon.
   *
   * [BehaviorSubject]: https://rxjs.dev/api/index/class/BehaviorSubject
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Polymorphic `this`.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the mutated instance.
   *
   * @example
   * Drop a *Model* instance by UUID:
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
  public delete<T extends Model = M>(
    this: T
  ): Observable<T> {
    return this.static.deleteOne<T>(this.id!).pipe(
      switchMap(() => this.clear()),
      tap(() => this.changes.complete())
    );
  }

  /**
   * Instance-scoped **find** method. Internally calls the static *findOne*
   * method on the `this`-context of an instance of a class extending the
   * abstract *Model* base class and then *assign*s the returned data to the
   * *Model* instance the **find** method was called upon.
   *
   * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   * [Shape]: https://sgrud.github.io/client/types/data.Model-1.Shape
   *
   * @param this - Polymorphic `this`.
   * @param graph - [Graph][] of fields to be included.
   * @param shape - [Shape][] of the *Model* to find.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the mutated instance.
   *
   * @example
   * **Find** a *Model* instance by UUID:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({
   *   id: '3068b30e-82cd-44c5-8912-db13724816fd'
   * });
   *
   * model.find([
   *   'id',
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
   * Instance-scoped **save** method. Internally calls the static *saveOne*
   * method on the `this`-context of an instance of a class extending the
   * abstract *Model* base class and then *assign*s the returned data to the
   * *Model* instance the **save** method was called upon.
   *
   * [Observable]: https://rxjs.dev/api/index/class/Observable
   *
   * @param this - Polymorphic `this`.
   * @param graph - Graph of fields to be included.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Observable][] of the mutated instance.
   *
   * @example
   * Persist a *Model* instance:
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   *
   * model.save([
   *   'id',
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
   * Instance-scoped **serialize** method. Internally calls the static
   * *serialize* method on the `this`-context of an instance of a class
   * extending the abstract *Model* base class.
   *
   * [Shape]: https://sgrud.github.io/client/types/data.Model-1.Shape
   *
   * @param this - Polymorphic `this`.
   * @param shallow - Whether to **serialize** shallowly.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Shape][] of this instance or undefined.
   *
   * @example
   * **Serialize** a *Model* instance:
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
   * Instance-scoped **treemap** method. Internally calls the static *treemap*
   * method on the `this`-context of an instance of a class extending the
   * abstract *Model* base class.
   *
   * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
   *
   * @param this - Polymorphic `this`.
   * @param shallow - Whether to **treemap** shallowly.
   * @typeParam T - Extending *Model* instance type.
   * @returns [Graph][] of this instance or undefined.
   *
   * @example
   * **Treemap** a *Model* instance:
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
