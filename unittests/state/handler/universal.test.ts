import { Linker } from '@sgrud/core';
import { StateHandler, Store, Universal } from '@sgrud/state';
import { of } from 'rxjs';

describe('@sgrud/state/handler/universal', () => {

  const handle = 'sgrud.test.store.class';
  const seed = { param: 'default' };
  const spy = jest.fn().mockReturnValue(of(seed));

  new Linker<typeof StateHandler>([
    [StateHandler, { deploy: spy } as any]
  ]);

  @Universal<typeof MyStore>(handle, seed)
  class MyStore extends Store<MyStore> { }

  describe('applying the decorator', () => {
    const linker = new Linker<typeof MyStore>();

    const deploy = [
      handle,
      MyStore,
      seed,
      false
    ];

    it('deploys the decorated class as store', () => {
      expect(spy).toHaveBeenCalledWith(...deploy);
      expect(linker.get(MyStore)).toBe(seed);
    });
  });

});
