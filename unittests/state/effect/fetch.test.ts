import { FetchEffect } from '@sgrud/state';

describe('@sgrud/state/effect/fetch', () => {

  describe('applying the effect', () => {
    const fetch = globalThis.fetch = jest.fn();
    const construct = () => new FetchEffect();
    const effect = FetchEffect.prototype.function.apply(undefined!);

    it('successfully applies the effect', () => {
      expect(construct).toThrowError(TypeError);
      expect(effect).not.toThrow();
      expect(fetch).toHaveBeenCalled();
    });
  });

});
