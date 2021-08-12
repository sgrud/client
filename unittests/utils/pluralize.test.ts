import { pluralize } from '@sgrud/utils';

describe('@sgrud/utils/pluralize', () => {

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
