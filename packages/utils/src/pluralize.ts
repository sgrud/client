const plurals: Record<string, string> = {
  '(quiz)$'                    : '$1zes',
  '^(ox)$'                     : '$1en',
  '([m|l])ouse$'               : '$1ice',
  '(matr|vert|ind)ix|ex$'      : '$1ices',
  '(x|ch|ss|sh)$'              : '$1es',
  '([^aeiouy]|qu)y$'           : '$1ies',
  '(hive)$'                    : '$1s',
  '(?:([^f])fe|([lr])f)$'      : '$1$2ves',
  '(shea|lea|loa|thie)f$'      : '$1ves',
  'sis$'                       : 'ses',
  '([ti])um$'                  : '$1a',
  '(tomat|potat|ech|her|vet)o$': '$1oes',
  '(bu)s$'                     : '$1ses',
  '(alias)$'                   : '$1es',
  '(octop)us$'                 : '$1i',
  '(ax|test)is$'               : '$1es',
  '(us)$'                      : '$1es',
  '([^s]+)$'                   : '$1s'
};

const irregulars: Record<string, string> = {
  child : 'children',
  foot  : 'feet',
  goose : 'geese',
  man   : 'men',
  move  : 'moves',
  person: 'people',
  sex   : 'sexes',
  tooth : 'teeth'
};

const uncountables: string[] = [
  'aircraft',
  'bison',
  'cod',
  'deer',
  'equipment',
  'fish',
  'hovercraft',
  'information',
  'money',
  'moose',
  'offspring',
  'pike',
  'rice',
  'salmon',
  'series',
  'sheep',
  'shrimp',
  'spacecraft',
  'species',
  'sugar',
  'swine',
  'trout',
  'tuna',
  'wood',
  'you'
];

export function pluralize(singular: string): string {
  if (uncountables.indexOf(singular.toLowerCase()) === -1) {
    for (const word in irregulars) {
      const pattern = new RegExp(`${word}$`, 'i');

      if (pattern.test(singular)) {
        return singular.replace(pattern, irregulars[word]);
      }
    }

    for (const regex in plurals) {
      const pattern = new RegExp(regex, 'i');

      if (pattern.test(singular)) {
        return singular.replace(pattern, plurals[regex]);
      }
    }
  }

  return singular;
}
