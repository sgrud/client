/**
 * Best-effort **semver** matcher. The supplied `version` will be tested against
 * the supplied `range`.
 *
 * @param version - The to-be tested semantic `version` string.
 * @param range - The `range` to test the `version` against.
 * @returns Whether `version` satisfies `range`.
 *
 * @example
 * Test `'1.2.3'` against `'>2 <1 || ~1.2.*'`:
 * ```ts
 * import { semver } from '@sgrud/core';
 *
 * semver('1.2.3', '>2 <1 || ~1.2.*'); // true
 * ```
 *
 * @example
 * Test `'1.2.3'` against `'~1.1'`:
 * ```ts
 * import { semver } from '@sgrud/core';
 *
 * semver('1.2.3', '~1.1'); // false
 * ```
 */
export function semver(version: string, range: string): boolean {
  const input = version.replace(/\+.*$/, '').split(/[-.]/);
  const paths = range.split(/\s*\|\|\s*/);

  for (const path of paths) {
    const parts = path.split(/\s+/);
    let tests = [] as [string, string[]][];
    let valid = true;

    for (let part of parts) {
      let index;
      let mode = '=';

      part = part.replace(/^[<>=~^]*/, (match) => {
        if (match) mode = match;
        return '';
      }).replace(/^V|\.[X*]/gi, '');

      if (part === 'latest' || /^[X~*^]*$/i.test(part)) {
        tests = [['>=', ['0', '0', '0', '0']]];
        break;
      }

      const split = part.replace(/\+.*$/, '').split(/[-.]/);

      if (mode === '^') {
        index = Math.min(split.lastIndexOf('0') + 1, split.length - 1, 2);
      } else if (mode === '~' || mode === '~>') {
        index = Math.min(split.length - 1, 1);
      } else {
        tests.push([mode, split]);
        continue;
      }

      const empty = new Array(split.length - index).fill(0);
      const match = split.slice(0, index + 1).concat(...empty);
      match[index] = (parseInt(match[index]) + 1).toString();
      tests.push(['>=', split], ['<', match]);
    }

    for (const [mode, taken] of tests) {
      const latest = input.some((i) => /[^\d]+/.test(i));
      const length = Math.min(input.length, taken.length);
      const source = input.slice(0, length).join('.');
      const target = taken.slice(0, length).join('.');
      const weight = source.localeCompare(target, undefined, {
        numeric: true,
        sensitivity: 'base'
      });

      valid &&= (!latest || length === input.length);

      switch (mode) {
        case '<': valid &&= weight < 0; break;
        case '<=': valid &&= weight <= 0; break;
        case '>': valid &&= weight > 0; break;
        case '>=': valid &&= weight >= 0; break;
        case '=': valid &&= weight === 0; break;
        default: valid = false; break;
      }

      if (!valid) {
        break;
      }
    }

    if (valid) {
      return true;
    }
  }

  return false;
}
