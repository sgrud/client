import { DispatchEffect, StateWorker } from '@sgrud/state';

describe('@sgrud/state/effect/dispatch', () => {

  /*
   * Fixtures
   */

  afterEach(() => mock.mockClear());
  const mock = jest.fn();

  /*
   * Variables
   */

  const effect = Object.create(DispatchEffect.prototype) as DispatchEffect;
  const stateWorker = { dispatch: mock } as unknown as StateWorker;

  /*
   * Unittests
   */

  describe('applying the effect', () => {
    it('successfully applies the effect', async() => {
      const dispatch = effect.function.call(stateWorker);
      await expect(dispatch(undefined!)).resolves.not.toThrow();

      mock.mockImplementationOnce(() => undefined);
      await expect(dispatch(undefined!)).resolves.not.toThrow();

      expect(mock).toBeCalled();
    });
  });

  describe('applying the effect wrongly', () => {
    const construct = () => new DispatchEffect();

    it('throws an error when applying the effect', async() => {
      mock.mockImplementation(construct);

      const dispatch = effect.function.call(stateWorker);
      await expect(dispatch(undefined!)).rejects.toThrowError(TypeError);

      expect(mock).toBeCalled();
    });
  });

});
