import { BusHandler } from '@sgrud/bus';
import { Symbol } from '@sgrud/core';
import { StateHandler, Stateful, Store } from '@sgrud/state';
import { Subject, from, map, of, timer } from 'rxjs';

describe('@sgrud/state/handler/stateful', () => {

  /*
   * Fixtures
   */

  afterEach(() => mock.mockClear());
  const mock = StateHandler.prototype.dispatch = jest.fn(() => {
    return of<Store.State<any>>({ param: undefined });
  });

  StateHandler[Symbol.observable] = () => of<any>({
    deploy: mock,
    dispatch: mock
  });

  /*
   * Variables
   */

  @Stateful('sgrud.test.store.class', { param: undefined })
  class Class extends Store<Class> {

    public readonly param?: string;

    public setParam(param: string): Store.State<this> {
      return Object.assign({}, this, { param });
    }

  }

  /*
   * Unittests
   */

  describe('applying the decorator', () => {
    it('deploys the decorated class as store', () => {
      expect(new Class()).toBeInstanceOf(Class);
      expect(mock).toBeCalledWith(
        'sgrud.test.store.class',
        expect.any(Function),
        { param: undefined },
        false
      );
    });
  });

  describe('constructing a stateful class', () => {
    const handler = new BusHandler();
    const stream = new Subject();

    it('returns a facade for the stateful class', (done) => {
      new Class().dispatch('setParam', ['value']).pipe(map((next) => {
        expect(next).toMatchObject({ param: undefined });
      })).subscribe({
        error: done
      });

      from(new Class()).pipe(map((next) => {
        expect(next).toBe('done');
      })).subscribe({
        complete: done,
        error: done
      });

      timer(250).pipe(map(() => 'done')).subscribe(stream);
      handler.publish('sgrud.test.store.class', stream).subscribe();
    });
  });

});
