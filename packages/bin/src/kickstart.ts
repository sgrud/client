import { rmSync } from 'fs';
import { join, resolve } from 'path';
import simpleGit from 'simple-git';
import { __, _b, _g, cli } from './.cli';

cli.command('kickstart [library]')
  .describe('Kickstarts a SGRUD-based project using `simple-git`')
  .example('kickstart # Run with default options')
  .example('kickstart preact --prefix ./module # Kickstart preact in ./module')
  .option('--prefix', 'Use an alternative working directory', './')
  .action((library, opts) => kickstart({ ...opts, library }));

/**
 * **kickstart**s a [SGRUD](https://sgrud.github.io)-based project using
 * [simple-git](https://github.com/steveukx/git-js).
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
 * @param options - The `options` object.
 * @returns An execution {@link Promise}.
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
 * **kickstart** `preact` in `./module`:
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

} = {}): Promise<void> {
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

  rmSync(join(prefix, '.git'));
}
