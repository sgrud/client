import sade from 'sade';
import packageJson from '../package.json';

/**
 * Sade instance used to provide the the SGRUD CLI.
 */
export const cli = sade('sgrud')
  .describe('@sgrud/bin - The SGRUD CLI')
  .version(packageJson.version);
