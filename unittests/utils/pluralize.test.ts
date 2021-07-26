import { pluralize } from '@sgrud/utils';

const table = [
  ['boy', 'boys'],
  ['girl', 'girls'],
  ['money', 'money'],
  ['thesis', 'theses'],
  ['woman', 'women'],
  ['you', 'you']
];

describe('@sgrud/utils/pluralize', () => {

  describe.each(table)('pluralizing %s', (singular, plural) => {
    it(`returns ${plural}`, () => {
      expect(pluralize(singular)).toBe(plural);
    });
  });

});
