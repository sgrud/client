/* eslint-disable @typescript-eslint/no-var-requires */
import { execSync } from 'child_process';
import { copySync, existsSync, mkdirpSync } from 'fs-extra';
import { join, resolve } from 'path';
import { cli } from './cli';

cli.command('kickstart [library]')
  .describe('Kickstarts an angular, lit, preact or vue-based SGRUD project')
  .example('kickstart # Run with default options')
  .example('kickstart preact --cwd ./project # Kickstart preact in ./project')
  .option('--cwd', 'Use an alternative working directory', './')
  .action((library, opts) => kickstart({ library, ...opts }));

/**
 * Kickstarts an
 * {@link https://angular.io|angular},
 * {@link https://lit.dev|lit},
 * {@link https://preactjs.com|preact} or
 * {@link https://vuejs.org|vue}-based SGRUD project.
 *
 * ```text
 * Description
 *   Kickstarts an angular, lit, preact or vue-based SGRUD project
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
 * @param library - Library which to base upon. (default: `'lit'`)
 * @param cwd - Use an alternative working directory. (default: `'./'`)
 *
 * @example Run with default options.
 * ```js
 * require('@sgrud/bin');
 * sgrud.Kickstart();
 * ```
 *
 * @example Kickstart vue in `./sgrud-vue`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.Kickstart({ cwd: './sgrud-vue', library: 'vue' });
 * ```
 */
export function kickstart({
  cwd = './',
  library = 'lit'
}: {
  cwd?: string;
  library?: string;
} = { }): void {
  const gitPath = join(cwd, 'node_modules', '.cache', 'sgrud');
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
