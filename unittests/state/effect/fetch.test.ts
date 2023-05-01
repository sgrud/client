import { FetchEffect, StateWorker } from '@sgrud/state';

describe('@sgrud/state/effect/fetch', () => {

  /*
   * Fixtures
   */

  afterEach(() => mock.mockClear());
  const mock = globalThis.fetch = jest.fn();

  /*
   * Variables
   */

  const effect = Object.create(FetchEffect.prototype) as FetchEffect;
  const stateWorker = { fetch: mock } as unknown as StateWorker;

  /*
   * Unittests
   */

  describe('applying the effect', () => {
    it('successfully applies the effect', async() => {
      const fetch = effect.function.call(stateWorker);
      await expect(fetch(undefined!)).resolves.not.toThrow();

      mock.mockImplementationOnce(() => undefined);
      await expect(fetch(undefined!)).resolves.not.toThrow();

      expect(mock).toBeCalled();
    });
  });

  describe('applying the effect wrongly', () => {
    const construct = () => new FetchEffect();

    it('throws an error when applying the effect', async() => {
      mock.mockImplementation(construct);

      const fetch = effect.function.call(stateWorker);
      await expect(fetch(undefined!)).rejects.toThrowError(TypeError);

      expect(mock).toBeCalled();
    });
  });

});
