import { assign, Linker, pluralize, TypeOf } from '@sgrud/core';
import { BehaviorSubject, finalize, identity, map, observable, Observable, of, OperatorFunction, Subscribable, switchMap, tap, throwError } from 'rxjs';
import { Querier } from '../querier/querier';
import { hasMany } from '../relation/has-many';
import { hasOne } from '../relation/has-one';
import { property, Property } from '../relation/property';
import { Enum } from './enum';

/**
 * Namespace containing types and interfaces to be used in conjunction with
 * classes extending the abstract model base class. All the types and interfaces
 * within this namespace are only applicable to classes extending the abstract
 * model base class, as their generic type argument is always constrained to
 * this abstract base class.
 *
 * @see {@link Model}
 */
export namespace Model {
  /* eslint-disable @typescript-eslint/indent */

  /**
   * Type alias for all fields, i.e., own enumerable properties, (excluding
   * internally used ones) of classes extending the abstract model base class.
   *
   * @typeParam T - Extending model instance type.
   */
  export type Field<T extends Model> = string &
    Exclude<keyof T, Exclude<keyof Model, 'id' | 'created' | 'modified'>>;

  /**
   * Type alias referencing {@link Params}.
   *
   * @typeParam T - Extending model instance type.
   *
   * @see {@link Params}
   */
  export type Filter<T extends Model> = Filter.Params<T>;

  /**
   * Mapped type to compile strongly typed graphs of classes extending the
   * abstract model base class, while providing intellisense.
   *
   * @typeParam T - Extending model instance type.
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
   * Mapped type to compile strongly typed property paths of classes extending
   * the abstract model base class, while providing intellisense.
   *
   * @typeParam T - Extending model instance type.
   * @typeParam S - String array limiting the path depth.
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
   * Mapped type to compile strongly typed shapes of classes extending the
   * abstract model base class, while providing intellisense.
   *
   * @typeParam T - Extending model instance type.
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
   * Interface describing the type, i.e., static constructable context, of
   * classes extending the abstract model base class.
   *
   * @typeParam T - Extending model instance type.
   */
  export interface Type<T extends Model> extends Required<typeof Model> {

    /**
     * Overridden and concretized constructor signature.
     *
     * @param args - Class constructor rest parameter.
     * @returns Constructed class instance.
     */
    new (...args: ConstructorParameters<typeof Model>): T;

  }

  /* eslint-enable @typescript-eslint/indent */
}

/**
 * Namespace containing types and interfaces to be used when searching through
 * the repositories of classes extending the abstract model base class. All the
 * interfaces within this namespace are only applicable to classes extending the
 * abstract model base class, as their generic type argument is always
 * constrained to this abstract base class.
 *
 * @see {@link Model}
 */
export namespace Model.Filter {

  /**
   * Type alias for a string union type of all possible filter conjunctions,
   * namely: `'AND'`, `'AND_NOT'`, `'OR'` and `'OR_NOT'`.
   */
  export type Conjunction =
    'AND' |
    'AND_NOT' |
    'OR' |
    'OR_NOT';

  /**
   * Type alias for a string union type of all possible filter operators,
   * namely: `'EQUAL'`, `'NOT_EQUAL'`, `'LIKE'`, `'GREATER_THAN'`,
   * `'GREATER_OR_EQUAL'`,  `'LESS_THAN'` and `'LESS_OR_EQUAL'`.
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
   * Interface describing filter expressions which may be employed through the
   * {@link Params} as part of a {@link findAll} invocation. Filter expressions
   * can either be the plain shape of an `entity` or compositions of multiple
   * filter expressions, conjunct by one of the {@link Conjunction}s.
   *
   * @typeParam T - Extending model instance type.
   */
  export interface Expression<T extends Model> {

    /**
     * Conjunction of multiple filter {@link Expression}s requested data models
     * are matched against. The {@link conjunction} sibling parameter has to be
     * undefined when supplying this parameter. By supplying filter expressions,
     * conjunct by specific {@link Conjunction} operators, fine-grained filter
     * operations can be compiled.
     *
     * @see {@link Conjunction}
     * @see {@link Expression}
     */
    conjunction?: {

      /**
       * List of {@link Expression}s which are logically combined through an
       * {@link operator}. These expressions may be nested and can be used to
       * construct complex composite filter operations.
       *
       * @see {@link Expression}
       * @see {@link operator}
       */
      operands: Expression<T>[];

      /**
       * {@link Conjunction} operator used to logically combine all supplied
       * {@link operands}.
       *
       * @see {@link Conjunction}
       * @see {@link operands}
       */
      operator?: Conjunction;

    };

    /**
     * Shape the requested data models are matched against. Supplying this
     * parameter requires the {@link conjunction} sibling parameter to be
     * undefined. By specifying the shape to match data models against, simple
     * filter operations can be compiled.
     *
     * @see {@link conjunction}
     */
    entity?: {

      /**
       * Filter {@link Operator} to use for matching.
       *
       * @see {@link Operator}
       */
      operator?: Operator;

      /**
       * Property path from within the data model which to match against. The
       * value which will be matched against has to be supplied through the
       * {@link value} property.
       *
       * @see {@link value}
       */
      path: Model.Path<T>;

      /**
       * Property value to match data models against. The property path of this
       * value has to be supplied through the {@link path} property.
       *
       * @see {@link path}
       */
      value: unknown;

    };

  }

  /**
   * Interface describing the parameters of, e.g., the {@link findAll} method.
   * This is the most relevant interface within this namespace (and is therefore
   * also referenced by the {@link Filter} type alias), as it describes the
   * input parameters of any filter operation.
   *
   * @typeParam T - Extending model instance type.
   */
  export interface Params<T extends Model> {

    /**
     * Desired sorting direction of the requested data models. To specify which
     * field the results should be sorted by, the {@link sort} property must be
     * supplied.
     *
     * @see {@link sort}
     */
    dir?: 'asc' | 'desc';

    /**
     * {@link Expression} to evaluate results against. This expression may be a
     * simple matching or more complex, conjunct and nested expressions.
     *
     * @see {@link Expression}
     */
    expression?: Expression<T>;

    /**
     * Page number, i.e., offset within the list of all results for a data model
     * request. This property should be used together with the page {@link size}
     * property.
     *
     * @see {@link size}
     */
    page?: number;

    /**
     * Free-text search field. This field overrides all {@link expression}s, as
     * such that if this field contains a value, all expressions are ignored and
     * only this free-text search filter is applied.
     *
     * @see {@link expression}
     */
    search?: string;

    /**
     * Page size, i.e., number of results which should be included within the
     * response to a data model request. This property should be used together
     * with the {@link page} offset property.
     *
     * @see {@link page}
     */
    size?: number;

    /**
     * Property path used to determine the value which to sort the requested
     * data models by. This property should be used together with the sorting
     * {@link dir}ection property.
     *
     * @see {@link dir}
     */
    sort?: Path<T>;

  }

}

// eslint-disable-next-line valid-jsdoc
/**
 * Abstract base class to implement data models. By extending this abstract base
 * class while providing the enforced symbol property containing the singular
 * name of the resulting data model, type safe data handling, i.e., retrieval,
 * mutation and storage, can easily be achieved. Through the use of the static-
 * and instance-scoped polymorphic `this`, all inherited operations warrant type
 * safety and provide intellisense.
 *
 * @typeParam M - Extending model instance type.
 *
 * @example Extend the model base class.
 * ```ts
 * import type { Model } from '@sgrud/data';
 * import { Property } from '@sgrud/data';
 * import { Provider } from '@sgrud/core';
 *
 * export class ExampleModel extends Model<ExampleModel> {
 *
 *   @Property(() => String)
 *   public field: string?;
 *
 *   protected [Symbol.toStringTag]: string = 'ExampleModel';
 *
 * }
 * ```
 */
export abstract class Model<M extends Model = any> {

  /**
   * Static commit method. Calling this method on a class extending the abstract
   * model base class, while supplying an `operation` and all its embedded
   * `variables`, will dispatch the supplied operation to the respective model
   * repository through the highest priority {@link Querier} or, if no querier
   * is compatible, throw an error. This method is the central point of origin
   * for all model-related data transferral and is internally called by all
   * other distinct methods of the model.
   *
   * @param this - Static polymorphic this.
   * @param operation - Operation to commit.
   * @param variables - Variables within the `operation`.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the commitment.
   * @throws Observable of ReferenceError.
   *
   * @example Commit a `query`-type operation.
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
   * @see {@link Querier}
   */
  public static commit<T extends Model>(
    this: Model.Type<T>,
    operation: Querier.Operation,
    variables: Querier.Variables = { }
  ): Observable<any> {
    const compatible = [];
    const linker = new Linker<typeof Querier>();
    const queriers = linker.getAll(Querier);
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
   * Static deleteAll method. Calling this method on a class extending the
   * model, while supplying a list of `uuids`, will dispatch the deletion of all
   * model instances identified by these UUIDs to the respective model
   * repository by internally calling the {@link commit} operation with suitable
   * arguments. Through this method, bulk-deletions from the respective model
   * repository can be achieved.
   *
   * @param this - Static polymorphic this.
   * @param uuids - UUIDs of model instances to be deleted.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the deletion.
   *
   * @example Delete all model instances by UUIDs.
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
   * Static deleteOne method. Calling this method on a class extending the
   * model, while supplying an `uuid`, will dispatch the deletion of the model
   * instance identified by this UUID to the respective model repository by
   * internally calling the {@link commit} operation with suitable arguments.
   * Through this method, the deletion of a single model instance from the
   * respective model repository can be achieved.
   *
   * @param this - Static polymorphic this.
   * @param uuid - UUID of the model instance to be deleted.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the deletion.
   *
   * @example Delete one model instance by UUID.
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
   * Static findAll method. Calling this method on a class extending the
   * abstract model base class, while supplying a `filter` to match model
   * instances by and a `graph` containing the fields to be included in the
   * result, will dispatch the lookup operation to the respective model
   * repository by internally calling the {@link commit} operation with suitable
   * arguments. Through this method, the bulk-lookup of model instances from the
   * respective model repository can be achieved.
   *
   * @param this - Static polymorphic this.
   * @param filter - Filter to find model instances by.
   * @param graph - Graph of fields to be included.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the find operation.
   *
   * @example Find all UUIDs for model instances modified between two dates.
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
   * Static findOne method. Calling this method on a class extending the
   * abstract model base class, while supplying the `shape` to match the model
   * instance by and a `graph` describing the fields to be included in the
   * result, will dispatch the lookup operation to the respective model
   * repository by internally calling the {@link commit} operation with suitable
   * arguments. Through this method, the retrieval of one specific model
   * instance from the respective model repository can be achieved.
   *
   * @param this - Static polymorphic this.
   * @param shape - Shape of the model instance to find.
   * @param graph - Graph of fields to be included.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the find operation.
   *
   * @example Find one model instance by UUID.
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
   * Static saveAll method. Calling this method on a class extending the
   * abstract model base class, while supplying a list of `models` which to save
   * and a `graph` describing the fields to be included in the result, will
   * dispatch the save operation to the respective model repository by
   * internally calling the {@link commit} operation with suitable arguments.
   * Through this method, bulk-persistance of model instances from the
   * respective model repository can be achieved.
   *
   * @param this - Static polymorphic this.
   * @param models - Array of models to be saved.
   * @param graph - Graph of fields to be included.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the save operation.
   *
   * @example Persist multiple models.
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
   * Static saveOne method. Calling this method on a class extending the
   * abstract model base class, while supplying a `model` which to save and a
   * `graph` describing the fields to be included in the result, will dispatch
   * the save operation to the respective model repository by internally calling
   * the {@link commit} operation with suitable arguments. Through this method,
   * persistance of one specific model instance from the respective model
   * repository can be achieved.
   *
   * @param this - Static polymorphic this.
   * @param model - The model which is to be saved.
   * @param graph - Graph of fields to be included.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the save operation.
   *
   * @example Persist a model.
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
   * Static serialize method. Calling this method on a class extending the
   * model, while supplying a `model` which to serialize and optionally enabling
   * `shallow` serialization, will return the shape of the model, i.e., a plain
   * JSON representation of all model fields, or undefined, if the supplied
   * `model` does not contain any fields or values. By serializing `shallow`ly,
   * only properties defined on the supplied `model` are included (which means,
   * all one-to-one and one-to-many associations are ignored). Through this
   * method, the serialization of one specific model instance from the
   * respective model repository can be achieved.
   *
   * @param this - Static polymorphic this.
   * @param model - The model which is to be serialized.
   * @param shallow - Whether to serialize shallowly.
   * @typeParam T - Extending model instance type.
   * @returns Shape of the model or undefined.
   *
   * @example Serialize a model.
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
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          data[key] = model[key].map((i) => i.serialize(shallow));
        }
      }

      for (const key in this.prototype[hasOne]) {
        if (!TypeOf.undefined(model[key as Model.Field<T>])) {
          // @ts-expect-error type casting nightmare
          data[key] = model[key].serialize(shallow);
        }
      }
    }

    return Object.keys(data).length ? data : undefined;
  }

  /**
   * Static treemap method. Calling this method on a class extending the
   * abstract model base class, while supplying a `model` which to treemap and
   * optionally enabling `shallow` treemapping, will return a graph describing
   * the fields which are declared and defined on the supplied `model`, or
   * undefined, if the supplied `model` does not contain any fields or values.
   * By treemapping `shallow`ly, only properties defined on the supplied `model`
   * are included (which means, all one-to-one and one-to-many associations are
   * ignored). Through this method, the graph for one specific model instance
   * from the respective model repository can be retrieved.
   *
   * @param this - Static polymorphic this.
   * @param model - The model which is to be treemapped.
   * @param shallow - Whether to treemap shallowly.
   * @typeParam T - Extending model instance type.
   * @returns Graph of the model or undefined.
   *
   * @example Treemap a model.
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
   * Static unravel method. Calling this method on a class extending the
   * abstract model base class, while supplying a `graph` describing the fields
   * which to unravel, will return the unraveled graph as raw string. Through
   * this method, the graph for one specific model instance from the respective
   * model repository can be unraveled into a raw string. This unraveled graph
   * can than be consumed by, e.g., the {@link commit} method.
   *
   * @param this - Static polymorphic this.
   * @param graph - Graph which is to be unraveled.
   * @typeParam T - Extending model instance type.
   * @returns Unraveled graph as raw string.
   *
   * @example Unravel a graph.
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
                  ? vars[keys[m]].toString()
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

  /**
   * Static valuate method. Calling this method on a class extending the
   * abstract model base class, while supplying a `model` and a `field` which to
   * valuate, will return the preprocessed value (e.g., primitive representation
   * of JavaScript Dates) of the supplied `field` of the supplied `model`.
   * Through this method, the preprocessed `field` value of one specific model
   * instance from the respective model repository can be retrieved.
   *
   * @param this - Static polymorphic this.
   * @param model - Model which is to be valuated.
   * @param field - Field of the model to be valuated.
   * @typeParam T - Extending model instance type.
   * @returns Valuated field value.
   *
   * @example Valuate a field.
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
   * Enforced symbol property containing the singular name of this model. The
   * value of this property represents the repository which all instances of
   * this model are considered to belong to. In Detail, the different operations
   * {@link commit}ted through this model are derived from this singular name
   * (and the corresponding {@link pluralize}d form).
   *
   * @example Provide a valid symbol property.
   * ```ts
   * import type { Model } from '@sgrud/data';
   * import { Provider } from '@sgrud/core';
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
   * Symbol property typed as callback to a Subscribable. The returned
   * Subscribable emits every mutation this model instance experiences.
   *
   * @returns Callback to a Subscribable.
   *
   * @example Subscribe to a model instance.
   * ```ts
   * import { from } from 'rxjs';
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel();
   * from(model).subscribe(console.log);
   * ```
   */
  public readonly [Symbol.observable]: () => Subscribable<M>;

  /**
   * Universally unique identifier of this model instance.
   */
  @Property(() => String)
  public id?: string;

  /**
   * Transient creation date of this model instance.
   */
  @Property(() => Date, true)
  public created?: Date;

  /**
   * Transient modification date of this model instance.
   */
  @Property(() => Date, true)
  public modified?: Date;

  /**
   * BehaviorSubject emitting every time this model instance experiences a
   * mutation.
   */
  protected readonly changes: BehaviorSubject<M>;

  /**
   * Symbol property used by the {@link HasOne} decorator.
   *
   * @see {@link HasOne}
   */
  private [hasOne]: Record<keyof M, () => unknown>;

  /**
   * Symbol property used by the {@link HasMany} decorator.
   *
   * @see {@link HasMany}
   */
  private [hasMany]: Record<keyof M, () => unknown>;

  /**
   * Symbol property used by the {@link Property} decorator.
   *
   * @see {@link Property}
   */
  private [property]: Record<keyof M, () => unknown>;

  /**
   * Type-asserted alias for the static model context.
   */
  private readonly static: Model.Type<M>;

  /**
   * `rxjs.observable` interop getter returning a callback to a Subscribable.
   */
  public get [observable](): () => Subscribable<M> {
    return () => this.changes.asObservable();
  }

  /**
   * Accessor to the singular name of this model.
   *
   * @returns Singular name of this model.
   */
  private get entity(): string {
    return this.type.endsWith('Entity') ? this.type.slice(0, -6) : this.type;
  }

  /**
   * Accessor to the pluralized name of this model.
   *
   * @returns Pluralized name of this model.
   */
  private get plural(): string {
    return pluralize(this.entity);
  }

  /**
   * Accessor to the raw name of this model.
   *
   * @returns Raw name of this model.
   */
  private get type(): string {
    return this[Symbol.toStringTag];
  }

  /**
   * Public constructor. The constructor of all classes extending the abstract
   * model base class, unless explicitly overridden, behaves analogous to the
   * instance-scoped {@link assign} method, as it takes all supplied `parts` and
   * assigns them to the instantiated and returned model. The constructor
   * furthermore wires some internal functionality, e.g., creates a new
   * {@link changes} BehaviorSubject which emits every mutation this model
   * instance experiences.
   *
   * @param parts - Array of parts to assign.
   */
  public constructor(...parts: Model.Shape<M>[]) {
    this.static = this.constructor as Model.Type<M>;
    this.changes = new BehaviorSubject<M>(this as Model as M);
    (this as Model as M).assign(...parts).subscribe();
  }

  /**
   * Instance-scoped assign method. Calling this method, while supplying a list
   * of `parts`, will assign all supplied `parts` to the model instance. The
   * assignment is implemented as deep merge assignment. Using this method, an
   * existing model instance can easily be mutated while still emitting the
   * mutated changes.
   *
   * @param this - Polymorphic this.
   * @param parts - Array of parts to assign.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the mutated instance.
   *
   * @example Assign parts to a model instance.
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
   * Instance-scoped clear method. Calling this method on an instance of a class
   * extending the abstract model base class, while optionally supplying a list
   * of `keys` which are to be cleared, will set the value of the properties
   * described by either the supplied `keys` or, if no `keys` were supplied, all
   * enumerable properties of the class extending the abstract model base class
   * to undefined, effectively clearing them.
   *
   * @param this - Polymorphic this.
   * @param keys - Optional array of keys to clear.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the mutated instance.
   *
   * @example Clear a model instance selectively.
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
   * Instance-scoped commit method. Internally calls {@link commit} on the
   * this-context of an instance of a class extending the abstract model base
   * class and furthermore {@link assign}s the returned data to the model
   * instance the find method was called upon. When supplying a `mapping`, the
   * returned data will be mutated by the supplied OperatorFunction (otherwise
   * this `mapping` defaults to
   * [rxjs.identity](https://rxjs.dev/api/index/function/identity)).
   *
   * @param this - Polymorphic this.
   * @param operation - GraphQL Operation to commit.
   * @param variables - Variables within the `operation`.
   * @param mapping - Mapping to apply to the result.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the mutated instance.
   *
   * @example Commit a `query`-type operation.
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
   *
   * @see {@link Querier}
   */
  public commit<T extends Model = M>(
    this: T,
    operation: Querier.Operation,
    variables: Querier.Variables = { },
    mapping: OperatorFunction<any, T> = identity
  ): Observable<T> {
    return this.static.commit<T>(operation, variables).pipe(
      mapping, switchMap((model) => this.assign(model as Model.Shape<T>))
    );
  }

  /**
   * Instance-scoped delete method. Internally calls {@link deleteOne} while
   * supplying the UUID of an instance of a class extending the abstract model
   * base class. Calling this method furthermore {@link clear}s the model
   * instance and finalizes its deletion by calling complete on the internal
   * {@link changes} BehaviorSubject of the model instance the delete method was
   * called upon.
   *
   * @param this - Polymorphic this.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the mutated instance.
   *
   * @example Delete a model instance by UUID.
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({
   *   id: '3068b30e-82cd-44c5-8912-db13724816fd'
   * });
   *
   * model.delete().subscribe(console.log);
   * ```
   *
   * @see {@link deleteOne}
   */
  public delete<T extends Model = M>(
    this: T
  ): Observable<T> {
    return this.static.deleteOne<T>(this.id!).pipe(
      switchMap(() => this.clear()),
      finalize(() => this.changes.complete())
    );
  }

  /**
   * Instance-scoped find method. Internally calls {@link findOne} on the
   * this-context of an instance of a class extending the abstract model base
   * class and furthermore {@link assign}s the returned data to the model
   * instance the find method was called upon.
   *
   * @param this - Polymorphic this.
   * @param graph - Graph of fields to be included.
   * @param shape - Shape of the model to find.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the mutated instance.
   *
   * @example Find a model instance by UUID.
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
   *
   * @see {@link findOne}
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
   * Instance-scoped save method. Internally calls {@link saveOne} on the
   * this-context of an instance of a class extending the abstract model base
   * class and furthermore {@link assign}s the returned data to the model
   * instance the save method was called upon.
   *
   * @param this - Polymorphic this.
   * @param graph - Graph of fields to be included.
   * @typeParam T - Extending model instance type.
   * @returns Observable of the mutated instance.
   *
   * @example Persist a model instance.
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
   *
   * @see {@link saveOne}
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
   * Instance-scoped serialize method. Internally calls {@link serialize} on the
   * this-context of an instance of a class extending the abstract model base
   * class.
   *
   * @param this - Polymorphic this.
   * @param shallow - Whether to serialize shallowly.
   * @typeParam T - Extending model instance type.
   * @returns Shape of this instance or undefined.
   *
   * @example Serialize a model instance.
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   * console.log(model.serialize()); // { field: 'example' }
   * ```
   *
   * @see {@link serialize}
   */
  public serialize<T extends Model = M>(
    this: T,
    shallow: boolean = false
  ): Model.Shape<T> | undefined {
    return this.static.serialize<T>(this, shallow);
  }

  /**
   * Instance-scoped treemap method. Internally calls {@link treemap} on the
   * this-context of an instance of a class extending the abstract model base
   * class.
   *
   * @param this - Polymorphic this.
   * @param shallow - Whether to treemap shallowly.
   * @typeParam T - Extending model instance type.
   * @returns Graph of this instance or undefined.
   *
   * @example Treemap a model instance.
   * ```ts
   * import { ExampleModel } from './example-model';
   *
   * const model = new ExampleModel({ field: 'example' });
   * console.log(model.treemap()); // ['field']
   * ```
   *
   * @see {@link treemap}
   */
  public treemap<T extends Model = M>(
    this: T,
    shallow: boolean = false
  ): Model.Graph<T> | undefined {
    return this.static.treemap<T>(this, shallow);
  }

}
