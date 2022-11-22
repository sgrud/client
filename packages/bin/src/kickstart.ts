/* eslint-disable @typescript-eslint/no-var-requires */

import { removeSync } from 'fs-extra';
import { join, resolve } from 'path';
import simpleGit from 'simple-git';
import { cli, _b, _g, __ } from './.cli';

cli.command('kickstart [library]')
  .describe('Kickstarts a SGRUD-based project using `simple-git`')
  .example('kickstart # Run with default options')
  .example('kickstart preact --prefix ./module # Kickstart preact in ./module')
  .option('--prefix', 'Use an alternative working directory', './')
  .action((library, opts) => kickstart({ ...opts, library }));

/**
 * **Kickstart**s a [SGRUD][]-based project using [simple-git][].
 *
 * ```text
 * Description
 *   Kickstarts a SGRUD-based project using `simple-git`
 *
 * Usage
 *   $ sgrud kickstart [library] [options]
 *
 * Options
 *   --prefix      Use an alternative working directory  (default ./)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud kickstart # Run with default options
 *   $ sgrud kickstart preact --prefix ./module # Kickstart preact in ./module
 * ```
 *
 * [SGRUD]: https://sgrud.github.io
 * [simple-git]: https://github.com/steveukx/git-js
 *
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example
 * Run with default options:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.kickstart();
 * ```
 *
 * @example
 * **Kickstart** `preact` in `./module`:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.kickstart({
 *   prefix: './module',
 *   library: 'preact'
 * });
 * ```
 */
export async function kickstart({
  library = 'sgrud',
  prefix = './'
}: {

  /**
   * Library which to base upon.
   *
   * @defaultValue `'sgrud'`
   */
  library?: string;

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  prefix?: string;

} = { }): Promise<void> {
  const { repository } = require(resolve(__dirname, 'package.json'));

  console.log(
    _g, '[kickstart]',
    _b, library,
    _g, '→',
    _b, prefix,
    __
  );

  await simpleGit().clone(
    repository.url.replace(/\/client$/, '/skeletons'),
    prefix = resolve(prefix)
  );

  await simpleGit(prefix).raw([
    'filter-branch',
    '--subdirectory-filter',
    library
  ]);

  removeSync(join(prefix, '.git'));
}
