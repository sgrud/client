import { Linker } from '@sgrud/core';
import { StateHandler, Store, Transient } from '@sgrud/state';
import { of } from 'rxjs';

describe('@sgrud/state/handler/transient', () => {

  const handle = 'sgrud.test.store.class';
  const seed = { param: 'default' };
  const spy = jest.fn().mockReturnValue(of(seed));

  new Linker<typeof StateHandler>([
    [StateHandler, { deploy: spy } as any]
  ]);

  @Transient<typeof MyStore>(handle, seed)
  class MyStore extends Store<MyStore> { }

  describe('applying the decorator', () => {
    const linker = new Linker<typeof MyStore>();

    const deploy = [
      handle,
      MyStore,
      seed,
      true
    ];

    it('deploys the decorated class as store', () => {
      expect(spy).toHaveBeenCalledWith(...deploy);
      expect(linker.get(MyStore)).toBe(seed);
    });
  });

});
