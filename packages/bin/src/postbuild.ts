/* eslint-disable @typescript-eslint/no-var-requires */

import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs-extra';
import { dirname, join, normalize, relative, resolve, sep } from 'path';
import { cli } from './cli';

cli.command('postbuild')
  .describe('Replicates exported package.json files in the SGRUD monorepo')
  .example('postbuild # Run with default options')
  .example('postbuild --cwd ./projects/sgrud # Run in ./projects/sgrud')
  .option('--cwd', 'Use an alternative working directory', './')
  .action((opts) => postbuild({ ...opts }));

/**
 * Replicates exported `package.json` files in the
 * [SGRUD monorepo](https://github.com/sgrud/client).
 *
 * ```text
 * Description
 *   Replicates exported package.json files in the SGRUD monorepo
 *
 * Usage
 *   $ sgrud postbuild [options]
 *
 * Options
 *   --cwd         Use an alternative working directory  (default ./)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud postbuild # Run with default options
 *   $ sgrud postbuild --cwd ./projects/sgrud # Run in ./projects/sgrud
 * ```
 *
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example Run with default options.
 * ```js
 * require('@sgrud/bin');
 * sgrud.postbuild();
 * ```
 *
 * @example Run in `./projects/sgrud`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.postbuild({ cwd: './projects/sgrud' });
 * ```
 */
export async function postbuild({
  cwd = './'
}: {

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  cwd?: string;

} = { }): Promise<void> {
  const commit = execSync('git rev-parse HEAD', { cwd }).toString().trim();
  const module = require(resolve(cwd, 'package.json'));
  const sha265 = createHash('sha256');
  const writes = [];

  for (const bundle of module.exports.values?.() || ['.']) {
    const origin = join(cwd, bundle, 'package.json');
    const source = require(resolve(origin));
    const target = { } as Record<string, string>;

    for (const key in source) {
      switch (key) {
        case 'exports':
        case 'main':
        case 'module':
        case 'unpkg':
          if (existsSync(join(bundle, source[key]))) {
            target[key] = source[key];
          }
          break;

        case 'source':
          delete source[key];
          break;
      }
    }

    for (const key in module) {
      switch (key) {
        case 'author':
        case 'bugs':
        case 'license':
          source[key] = module[key];
          break;

        case 'homepage':
          source[key] = [
            module[key], 'tree', commit.substr(0, 7), normalize(bundle)
          ].join(sep);
          break;

        case 'repository':
          source[key] = module[key];
          source[key].commit = commit;
          source[key].directory = bundle;
          break;
      }
    }

    if (Object.keys(target).length) {
      const sorted = Object.values(target).sort();
      const [a, b] = [dirname(sorted[0]), dirname(sorted[sorted.length - 1])];
      let i = 0; while (i < a.length && a[i] === b[i]) i++;

      const digest = { } as Record<string, string>;
      const folder = join(bundle, a.substring(0, i));
      const output = join(cwd, folder, 'package.json');
      if (existsSync(output)) continue;

      for (const key in target) {
        const bytes = readFileSync(join(bundle, target[key]));
        digest[key] = 'sha256-' + sha265.copy().update(bytes).digest('base64');
        target[key] = './' + relative(folder, join(bundle, target[key]));
      }

      const content = JSON.stringify({ ...source, ...target, digest });
      writes.push([origin, output, content]);
    }
  }

  if (writes.length) {
    console.log('Replicating exported package.json');
    const [_, g, b] = ['\x1b[0m', '\x1b[32m', '\x1b[34m'];
    for (const [origin, output, content] of writes) {
      console.log(b, origin, g, '→', b, output, _);
      writeFileSync(output, content);
    }
  }
}
