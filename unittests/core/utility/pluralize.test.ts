import { pluralize } from '@sgrud/core';

describe('@sgrud/core/utility/pluralize', () => {

  const table = [
    ['boy', 'boys'],
    ['girl', 'girls'],
    ['money', 'money'],
    ['thesis', 'theses'],
    ['woman', 'women'],
    ['you', 'you']
  ];

  describe.each(table)('pluralizing %s', (singular, plural) => {
    it(`returns ${plural}`, () => {
      expect(pluralize(singular)).toBe(plural);
    });
  });

});
