import { Observable } from 'rxjs';
import { Model } from '../model/model';

export namespace Query {

  export type Conjunction =
    'AND' |
    'AND_NOT' |
    'OR' |
    'OR_NOT';

  export type Operator =
    'EQUAL' |
    'GREATER_OR_EQUAL' |
    'GREATER_THAN' |
    'LESS_OR_EQUAL' |
    'LESS_THAN' |
    'LIKE' |
    'NOT_EQUAL';

  export type Type =
    'mutation' |
    'query' |
    'subscription';

  export type Value = `${Query.Type} ${string}`;

  export interface Expression<T extends Model> {
    conjunction?: {
      operator?: Conjunction;
      operands: Expression<T>[];
    };
    entity?: {
      operator?: Operator;
      path: Model.Path<T>;
      value: unknown;
    };
  }

  export interface Filter<T extends Model> {
    dir?: 'asc' | 'desc';
    expression?: Expression<T>;
    page?: number;
    search?: string;
    size?: number;
    sort?: string;
  }

}

export abstract class Query {

  public abstract readonly types: Set<Query.Type>;

  public abstract commit(
    operation: Query.Value,
    variables: Record<string, unknown>
  ): Observable<any>;

  public abstract priority(
    model: Model.Type<any>
  ): number;

}
