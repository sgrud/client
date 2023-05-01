import { pluralize } from '@sgrud/core';

describe('@sgrud/core/utility/pluralize', () => {

  /*
   * Variables
   */

  const table = [
    ['boy', 'boys'],
    ['girl', 'girls'],
    ['money', 'money'],
    ['thesis', 'theses'],
    ['woman', 'women'],
    ['you', 'you']
  ];

  /*
   * Unittests
   */

  describe.each(table)('pluralizing %s', (singular, plural) => {
    it('returns ' + plural, () => {
      expect(pluralize(singular)).toBe(plural);
    });
  });

});
