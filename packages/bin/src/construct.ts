/* eslint-disable @typescript-eslint/no-var-requires */

import { Assign } from '@sgrud/core';
import { readFileSync } from 'fs-extra';
import { Module } from 'module';
import { join, resolve } from 'path';
import { cli } from './.cli';

cli.command('construct [...entries]')
  .describe('Builds a SGRUD-based project using `microbundle`')
  .example('construct # Run with default options')
  .example('construct ./project/main.ts # Build entry ./project/main.ts')
  .example('construct --cwd ./project --format umd # Build ./project as umd')
  .option('--compress', 'Compress/minify build output', true)
  .option('--cwd', 'Use an alternative working directory', './')
  .option('--format', 'Build specified formats', 'commonjs,modern,umd')
  .action((_ = [], opts) => construct({ ...opts, entries: opts._.concat(_) }));

/**
 * Builds a [SGRUD](https://github.com/sgrud/client)-based project using
 * [microbundle](https://www.npmjs.com/package/microbundle).
 *
 * ```text
 * Description
 *   Builds a SGRUD-based project using `microbundle`
 *
 * Usage
 *   $ sgrud construct [...entries] [options]
 *
 * Options
 *   --compress    Compress/minify build output  (default true)
 *   --cwd         Use an alternative working directory  (default ./)
 *   --format      Build specified formats  (default commonjs,modern,umd)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud construct # Run with default options
 *   $ sgrud construct ./project/main.ts # Build entry ./project/main.ts
 *   $ sgrud construct --cwd ./project --format umd # Build ./project as umd
 * ```
 *
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example Run with default options.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.construct();
 * ```
 *
 * @example Build entry `./project/main.ts`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.construct({ entries: ['./project/main.ts'] });
 * ```
 *
 * @example Build `./project` as `umd`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.construct({ cwd: './project', format: 'umd' });
 * ```
 */
export async function construct({
  compress = true,
  cwd = './',
  entries = undefined,
  format = 'commonjs,modern,umd'
}: {

  /**
   * Compress/minify build output.
   *
   * @defaultValue `true`
   */
  compress?: boolean;

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  cwd?: string;

  /**
   * Entry points to build.
   *
   * @defaultValue `package.json#source`
   */
  entries?: string[];

  /**
   * Build specified formats.
   *
   * @defaultValue `'commonjs,modern,umd'`
   */
  format?: string;

} = { }): Promise<void> {
  const builder = require.resolve('microbundle');
  const current = require(resolve(cwd, 'package.json'));
  const general = require(join(__dirname, 'package.json'));
  const helpers = current.dependencies?.['@babel/runtime'];
  const patched = readFileSync(builder).toString().replace(
    'if (modern) cache = false;',
    'cache = false;'
  ).replace(
    'plugins: []',
    `plugins: [
      require('rollup-plugin-web-worker-loader')({
        extensions: ['.js'].concat(useTypescript ? '.ts' : []),
        external: [],
        pattern: /worker:(.+)/,
        sourcemap: options.sourcemap && !options.compress,
      }),
    ]`
  ).replace(
    /babelHelpers: 'bundled'/g,
    `babelHelpers: 'runtime', plugins: [
      ['@babel/plugin-transform-runtime', {
        version: ${helpers ? `'${helpers as string}'` : 'undefined'}
      }]
    ]`
  );

  const globals = Object.entries<string>({
    ...current.amdNames,
    ...general.amdNames
  }).map(([key, value]) => {
    return value === null
      ? `${key}=${key.split(/\W/).filter(Boolean).join('.')}`
      : `${key}=${value}`;
  }).join(',');

  const microbundle = new Module('microbundle', module) as Assign<{
    _compile: (content: string, filename: string) => void;
    exports: (opts: object) => Promise<{ output: string }>;
  }, InstanceType<typeof Module>>;

  microbundle.paths = module.paths;
  microbundle._compile(patched, builder);

  return microbundle.exports({
    compress,
    css: 'inline',
    'css-modules': false,
    cwd,
    entries,
    format,
    globals,
    'pkg-main': true,
    workers: false
  }).then(({ output }) => {
    console.log(output);
  });
}
