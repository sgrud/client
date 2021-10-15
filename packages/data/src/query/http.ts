import { HttpClient, Provider, TypeOf } from '@sgrud/utils';
import { Observable, pluck } from 'rxjs';
import { Model } from '../model/model';
import { Query } from './query';

export class HttpQuery
  extends Provider<typeof Query>('sgrud.data.query.Query') {

  public override readonly types: Set<Query.Type> = new Set<Query.Type>([
    'mutation',
    'query'
  ]);

  public constructor(
    private readonly endpoint: string,
    private readonly prioritize: number | Map<Model.Type<any>, number> = 0
  ) {
    super();
  }

  public override commit(
    operation: Query.Value,
    variables: Record<string, unknown>
  ): Observable<any> {
    return HttpClient.post(this.endpoint, {
      query: operation,
      variables
    }).pipe(pluck('response'));
  }

  public override priority(model: Model.Type<any>): number {
    if (TypeOf.number(this.prioritize)) {
      return this.prioritize;
    }

    return this.prioritize.get(model) || 0;
  }

}
