import { DispatchEffect } from '@sgrud/state';

describe('@sgrud/state/effect/dispatch', () => {

  describe('applying the effect', () => {
    const dispatch = jest.fn();
    const construct = () => new DispatchEffect();
    const effect = DispatchEffect.prototype.function.apply({ dispatch } as any);

    it('successfully applies the effect', () => {
      expect(construct).toThrowError(TypeError);
      expect(effect).not.toThrow();
      expect(dispatch).toHaveBeenCalled();
    });
  });

});
