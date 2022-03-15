/* eslint-disable @typescript-eslint/no-var-requires */

import { execSync } from 'child_process';
import { copySync, existsSync, mkdirpSync } from 'fs-extra';
import { join, resolve } from 'path';
import { cli } from './.cli';

cli.command('kickstart [library]')
  .describe('Kickstarts a SGRUD-based project')
  .example('kickstart # Run with default options')
  .example('kickstart preact --cwd ./project # Kickstart preact in ./project')
  .option('--cwd', 'Use an alternative working directory', './')
  .action((library, opts) => kickstart({ ...opts, library }));

/**
 * Kickstarts a [SGRUD](https://github.com/sgrud/client)-based project.
 *
 * ```text
 * Description
 *   Kickstarts a SGRUD-based project
 *
 * Usage
 *   $ sgrud kickstart [library] [options]
 *
 * Options
 *   --cwd         Use an alternative working directory  (default ./)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud kickstart # Run with default options
 *   $ sgrud kickstart preact --cwd ./project # Kickstart preact in ./project
 * ```
 *
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example Run with default options.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.kickstart();
 * ```
 *
 * @example Kickstart `preact` in `./project`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.kickstart({ cwd: './project', library: 'preact' });
 * ```
 */
export async function kickstart({
  cwd = './',
  library = 'fast'
}: {

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  cwd?: string;

  /**
   * Library which to base upon.
   *
   * @defaultValue `'fast'`
   */
  library?: string;

} = { }): Promise<void> {
  const gitPath = join(cwd, 'node_modules', '.cache', '@sgrud', 'kickstart');
  const pkgJson = require(resolve(join(__dirname, 'package.json')));

  if (!existsSync(gitPath)) {
    mkdirpSync(gitPath);
    execSync(`git clone ${pkgJson.repository.url as string} ${gitPath}`);
  } else {
    execSync(`git -C ${gitPath} pull --force`);
  }

  if (!existsSync(cwd)) {
    mkdirpSync(cwd);
  }

  copySync(join(gitPath, 'skeletons', library), cwd);
  execSync(`npm --prefix ${cwd} install`);
}
