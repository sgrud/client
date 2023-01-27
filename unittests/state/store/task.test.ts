import { Router } from '@sgrud/shell';
import { RouteStore, StateHandler, StoreTask } from '@sgrud/state';
import { from, of } from 'rxjs';
import { Linker } from '../../../dist/core';

describe('@sgrud/state/store/task', () => {

  const dispatch = jest.fn(() => of(state));
  const get = jest.fn();

  const state = {
    path: undefined as unknown as string,
    search: undefined as unknown as string,
    segment: undefined as unknown as Router.Segment<string>
  };

  new Linker<typeof StateHandler | typeof StoreTask, unknown>([
    [StateHandler, { get }],
    [StoreTask, new StoreTask()]
  ]);

  new Router().add({
    path: '',
    children: [
      {
        path: 'one'
      },
      {
        path: 'two'
      }
    ]
  });

  describe('utilizing the route store without deploying it', () => {
    const construct = () => new RouteStore();
    const navigate = () => RouteStore.prototype.dispatch('navigate', [state]);
    const subscribe = () => from(RouteStore.prototype).subscribe();

    const navigated = RouteStore.prototype.navigate.call(undefined, state);

    it('allows prototype method calls', () => {
      expect(navigated).toMatchObject(state);
    });

    it('throws an error on construction', () => {
      expect(construct).toThrowError(TypeError);
    });

    it('throws an error on dispatching', () => {
      expect(navigate).toThrowError(ReferenceError);
    });

    it('throws an error on subscribing', () => {
      expect(subscribe).toThrowError(TypeError);
    });
  });

  describe('navigating without a route store deployment', () => {
    const router = new Router();

    it('correctly navigates without dispatching a store action', (done) => {
      router.navigate('one').subscribe((next) => {
        expect(get).toHaveBeenCalledWith(RouteStore.handle);
        expect(next.path).toBe('one');
        done();
      });
    });
  });

  describe('navigating with a route store deployment', () => {
    const router = new Router();

    it('correctly navigates while dispatching a store action', (done) => {
      get.mockImplementation(() => ({ dispatch }));

      router.navigate('two').subscribe((next) => {
        expect(dispatch).toHaveBeenCalledWith('navigate', [next]);
        expect(get).toHaveBeenCalledWith(RouteStore.handle);
        expect(next.path).toBe('two');
        done();
      });
    });
  });

});
