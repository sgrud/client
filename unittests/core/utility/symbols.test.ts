import { Symbol } from '@sgrud/core';

describe('@sgrud/core/utility/symbols', () => {

  /*
   * Variables
   */

  const table = [
    [Symbol.hasInstance, 'symbol'],
    [Symbol.observable, 'string'],
    [Symbol.toStringTag, 'symbol']
  ] as const;

  /*
   * Unittests
   */

  describe.each(table)('typeof %s', (symbol, type) => {
    it('returns ' + type, () => {
      expect(typeof symbol).toBe(type);
    });
  });

});
