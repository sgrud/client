/* eslint-disable @typescript-eslint/no-var-requires */

import { createHash } from 'crypto';
import { copySync, existsSync, readFileSync, writeFileSync } from 'fs-extra';
import { basename, dirname, join, normalize, relative, resolve } from 'path';
import simpleGit from 'simple-git';
import { cli, _b, _g, __ } from './.cli';

cli.command('postbuild [...modules]')
  .describe('Replicates exported package metadata for SGRUD-based projects')
  .example('postbuild # Run with default options')
  .example('postbuild ./project/module # Postbuild ./project/module')
  .example('postbuild --prefix ./module # Run in ./module')
  .option('--prefix', 'Use an alternative working directory', './')
  .action((_ = [], opts) => postbuild({ ...opts, modules: opts._.concat(_) }));

/**
 * Replicates exported package metadata for
 * [SGRUD](https://github.com/sgrud/client)-based projects.
 *
 * ```text
 * Description
 *   Replicates exported package metadata for SGRUD-based projects
 *
 * Usage
 *   $ sgrud postbuild [...modules] [options]
 *
 * Options
 *   --prefix      Use an alternative working directory  (default ./)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud postbuild # Run with default options
 *   $ sgrud postbuild ./project/module # Postbuild ./project/module
 *   $ sgrud postbuild --prefix ./module # Run in ./module
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
 * @example Postbuild `./project/module`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.postbuild({ modules: ['./project/module'] });
 * ```
 *
 * @example Run in `./module`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.postbuild({ prefix: './module' });
 * ```
 */
export async function postbuild({
  modules = [],
  prefix = './'
}: {

  /**
   * Modules to build.
   *
   * @defaultValue `undefined`
   */
  modules?: string[];

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  prefix?: string;

} = { }): Promise<void> {
  const commit = await simpleGit(prefix).revparse('HEAD');
  const module = require(resolve(prefix, 'package.json'));
  const sha265 = createHash('sha256');
  const writes = [];

  if (!modules.length) {
    modules = module.sgrud?.postbuild || ['./'];
  }

  for (let i = 0; i < modules.length; i++) {
    const assets = [];
    const origin = join(prefix, modules[i], 'package.json');
    const source = require(resolve(origin));
    const target = { } as Record<string, string>;

    for (const key in source) {
      switch (key) {
        case 'amdNames':
        case 'source':
          delete source[key];
          break;

        case 'exports':
        case 'main':
        case 'module':
        case 'unpkg':
          if (existsSync(resolve(modules[i], source[key]))) {
            target[key] = source[key];
          } else {
            delete source[key];
          }
          break;

        case 'sgrud':
          if (source[key].resources) {
            assets.push(...source[key].resources);
          }
          break;
      }
    }

    if (!source.private) {
      for (const key in module) {
        switch (key) {
          case 'author':
          case 'bugs':
          case 'license':
            source[key] = module[key];
            break;

          case 'homepage':
            source[key] = [
              module[key], 'tree', commit.slice(0, 7), normalize(modules[i])
            ].join('/');
            break;

          case 'repository':
            source[key] = module[key];
            source[key].commit = commit;
            source[key].directory = modules[i];
            break;
        }
      }
    }

    if (Object.keys(target).length) {
      const sorted = Object.values(target).sort();
      const [a, b] = [dirname(sorted[0]), dirname(sorted[sorted.length - 1])];
      let l = 0; while (l < a.length && a[l] === b[l]) l++;

      const digest = { } as Record<string, string>;
      const folder = join(modules[i], a.slice(0, l));
      const output = join(prefix, folder, 'package.json');
      if (existsSync(output)) continue;

      for (const key in target) {
        const bytes = readFileSync(resolve(modules[i], target[key]));
        digest[key] = 'sha256-' + sha265.copy().update(bytes).digest('base64');
        target[key] = './' + relative(folder, resolve(modules[i], target[key]));
      }

      writes.push([
        origin,
        output,
        JSON.stringify({
          ...source,
          ...target,
          digest,
          sgrud: source.sgrud?.runtimify?.length
            ? { runtimify: source.sgrud.runtimify }
            : undefined
        })
      ]);

      for (const asset of assets) {
        writes.push([
          join(prefix, modules[i], asset),
          join(prefix, folder, basename(asset)),
          undefined
        ] as const);
      }
    }

    if (source.sgrud?.postbuild?.length) {
      for (const submodule of source.sgrud.postbuild) {
        modules.splice(i + 1, 0, join(modules[i], submodule));
      }
    }
  }

  for (const [source, target, content] of writes) {
    console.log(_b, source, _g, '→', _b, target, __);

    if (content) {
      writeFileSync(target, content);
    } else {
      copySync(source, target);
    }
  }
}
