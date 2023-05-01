import { StateEffect, StateWorker } from '@sgrud/state';

describe('@sgrud/state/effect/state', () => {

  /*
   * Fixtures
   */

  afterEach(() => mock.mockClear());
  const mock = jest.fn(() => ({ get: mock, has: mock })) as jest.Mock;

  /*
   * Variables
   */

  const effect = Object.create(StateEffect.prototype) as StateEffect;
  const stateWorker = { states: mock() } as unknown as StateWorker;

  /*
   * Unittests
   */

  describe('applying the effect', () => {
    it('successfully applies the effect', async() => {
      const state = effect.function.call(stateWorker);
      await expect(state(undefined!)).resolves.not.toThrow();

      mock.mockImplementationOnce(() => undefined);
      await expect(state(undefined!)).resolves.not.toThrow();

      expect(mock).toBeCalled();
    });
  });

  describe('applying the effect wrongly', () => {
    const construct = () => new StateEffect();

    it('throws an error when applying the effect', async() => {
      mock.mockImplementation(construct);

      const state = effect.function.call(stateWorker);
      await expect(state(undefined!)).rejects.toThrowError(TypeError);

      expect(mock).toBeCalled();
    });
  });

});
