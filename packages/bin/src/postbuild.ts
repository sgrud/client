/* eslint-disable @typescript-eslint/no-var-requires */

import { createHash } from 'crypto';
import { copySync, existsSync, readFileSync, statSync, writeFileSync } from 'fs-extra';
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
 * Replicates exported package metadata for [SGRUD][]-based projects.
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
 * [SGRUD]: https://sgrud.github.io
 *
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example
 * Run with default options:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.postbuild();
 * ```
 *
 * @example
 * **Postbuild** `./project/module`:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.postbuild({
 *   modules: ['./project/module']
 * });
 * ```
 *
 * @example
 * Run in `./module`:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.postbuild({
 *   prefix: './module'
 * });
 * ```
 */
export async function postbuild({
  modules = [],
  prefix = './'
}: {

  /**
   * Modules to **postbuild**.
   *
   * @defaultValue `package.json#sgrud.postbuild`
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
  const operations = [];

  if (!modules.length) {
    modules = ['./'];
  }

  for (let i = 0; i < modules.length; i++) {
    const operation = [join(prefix, modules[i], 'package.json')];
    const resources = [];
    const runtimify = [];

    const source = require(resolve(operation[0]));
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
          for (const sgrudKey in source[key]) {
            switch (sgrudKey) {
              case 'resources':
                resources.push(...source[key][sgrudKey]);
                break;

              case 'runtimify':
                runtimify.push(...source[key][sgrudKey]);
                break;
            }
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
      const sorted = Object.values(target).map(dirname).sort();
      const [a, b] = [sorted[0], sorted[sorted.length - 1]];
      let n = 0; while (n < a.length && a[n] === b[n]) n++;

      const hashes = { } as Record<string, string>;
      const path = join(modules[i], sorted[0].slice(0, n));
      operation.push(join(prefix, path, 'package.json'));

      for (const key in target) {
        const file = resolve(modules[i], target[key]);
        target[key] = './' + relative(path, file);

        if (statSync(file).isFile()) {
          const hash = createHash('sha256').update(readFileSync(file));
          hashes[key] = 'sha256-' + hash.digest('base64');
        }
      }

      operations.push(operation.concat(JSON.stringify({
        ...source,
        ...target,
        digest: Object.keys(hashes).length ? hashes : undefined,
        sgrud: runtimify.length ? { runtimify } : undefined
      })));

      for (const resource of resources) {
        operations.push([
          join(prefix, modules[i], resource),
          join(prefix, path, basename(resource))
        ]);
      }
    }

    if (source.sgrud?.postbuild?.length) {
      for (let j = source.sgrud.postbuild.length - 1; j >= 0; j--) {
        modules.splice(i + 1, 0, join(modules[i], source.sgrud.postbuild[j]));
      }
    }
  }

  for (const [source, target, content] of operations) {
    console.log(
      _g, '[postbuild]',
      _b, source,
      _g, '→',
      _b, target,
      __
    );

    if (content) {
      writeFileSync(target, content);
    } else {
      copySync(source, target);
    }
  }
}
