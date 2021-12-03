import sade from 'sade';
import packageJson from '../package.json';

/**
 * RGB (and clear) console colors.
 */
export const [_r, _g, _b, __] = ['\x1b[31m', '\x1b[32m', '\x1b[34m', '\x1b[0m'];

/**
 * [sade](https://www.npmjs.com/package/sade) instance used to provide the the
 * SGRUD CLI.
 */
export const cli = sade('sgrud')
  .describe('@sgrud/bin - The SGRUD CLI')
  .version(packageJson.version);
