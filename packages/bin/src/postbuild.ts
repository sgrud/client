/* eslint-disable @typescript-eslint/no-var-requires */

import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { copySync, existsSync, readFileSync, writeFileSync } from 'fs-extra';
import { basename, dirname, join, normalize, relative, resolve } from 'path';
import { cli, _b, _g, __ } from './.cli';

cli.command('postbuild')
  .describe('Replicates exported package metadata for SGRUD-based projects')
  .example('postbuild # Run with default options')
  .example('postbuild --cwd ./projects/sgrud # Run in ./projects/sgrud')
  .option('--cwd', 'Use an alternative working directory', './')
  .action((opts) => postbuild({ ...opts }));

/**
 * Replicates exported package metadata for
 * [SGRUD](https://github.com/sgrud/client)-based projects.
 *
 * ```text
 * Description
 *   Replicates exported package metadata for SGRUD-based projects
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
 * sgrud.bin.postbuild();
 * ```
 *
 * @example Run in `./projects/sgrud`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.postbuild({ cwd: './projects/sgrud' });
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

  for (const bundle of module.exports?.values?.() ?? ['./']) {
    const assets = [];
    const origin = join(cwd, bundle, 'package.json');
    const source = require(resolve(origin));
    const target = { } as Record<string, string>;

    for (const key in source) {
      switch (key) {
        case 'copy':
          assets.push(...source[key]);
          delete source[key];
          break;

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
            module[key], 'tree', commit.slice(0, 7), normalize(bundle)
          ].join('/');
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
      let l = 0; while (l < a.length && a[l] === b[l]) l++;

      const digest = { } as Record<string, string>;
      const folder = join(bundle, a.slice(0, l));
      const output = join(cwd, folder, 'package.json');
      if (existsSync(output)) continue;

      for (const key in target) {
        const bytes = readFileSync(join(bundle, target[key]));
        digest[key] = 'sha256-' + sha265.copy().update(bytes).digest('base64');
        target[key] = './' + relative(folder, join(bundle, target[key]));
      }

      writes.push([
        origin,
        output,
        JSON.stringify({
          ...source,
          ...target,
          digest
        })
      ]);

      for (const asset of assets) {
        writes.push([
          join(cwd, bundle, asset),
          join(cwd, folder, basename(asset)),
          undefined
        ] as const);
      }
    }
  }

  if (writes.length) {
    console.log('Replicating exported package metadata');

    for (const [source, target, content] of writes) {
      console.log(_b, source, _g, '→', _b, target, __);

      if (content) {
        writeFileSync(target, content);
      } else {
        copySync(source, target);
      }
    }
  }
}
