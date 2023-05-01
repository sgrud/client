import sade from 'sade';
import { version } from '../package.json';

/**
 * RGB (and clear) console colors.
 */
export const [
  _r,
  _g,
  _b,
  __
] = [
  '\x1b[31m',
  '\x1b[32m',
  '\x1b[34m',
  '\x1b[0m'
];

/**
 * [sade](https://github.com/lukeed/sade) instance providing the
 * [SGRUD](https://sgrud.github.io) CLI.
 */
export const cli = sade('sgrud')
  .describe('@sgrud/bin - The SGRUD CLI')
  .version(version);
