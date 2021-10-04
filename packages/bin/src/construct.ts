/* eslint-disable @typescript-eslint/no-var-requires */

import { Assign } from '@sgrud/utils';
import { readFileSync } from 'fs-extra';
import { Module } from 'module';
import { resolve } from 'path';
import { cli } from './cli';

cli.command('construct [...entries]')
  .describe('Builds a SGRUD-based project using `microbundle`')
  .example('construct # Run with default options')
  .example('construct ./project/main.ts # Build entry ./project/main.ts')
  .example('construct --cwd ./project --format umd # Build ./project as umd')
  .option('--compress', 'Compress/minify build output', true)
  .option('--cwd', 'Use an alternative working directory', './')
  .option('--entries', 'Entry modules to build  (default package.json#source)')
  .option('--format', 'Build specified formats', 'cjs,esm,modern,umd')
  .action((entries, opts) => construct({ ...opts, entries }));

/**
 * Builds a SGRUD-based project using
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
 *   --entries     Entry modules to build  (default package.json#source)
 *   --format      Build specified formats  (default cjs,esm,modern,umd)
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
 * sgrud.construct();
 * ```
 *
 * @example Build entry `./project/main.ts`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.construct({ entries: './project/main.ts' });
 * ```
 *
 * @example Build `./project` as `umd`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.construct({ cwd: './project', format: 'umd' });
 * ```
 */
export async function construct({
  compress = true,
  cwd = './',
  entries = undefined,
  format = 'cjs,esm,modern,umd'
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
   * Entry modules to build.
   *
   * @defaultValue `package.json#source`
   */
  entries?: string[];

  /**
   * Build specified formats.
   *
   * @defaultValue `'cjs,esm,modern,umd'`
   */
  format?: string;

} = { }): Promise<void> {
  const builder = require.resolve('microbundle');
  const current = require(resolve(cwd, 'package.json'));
  const general = require(resolve(__dirname, 'package.json'));
  const helpers = current.dependencies['@babel/runtime'] as string;
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
        sourcemap: options.compress === false && options.sourcemap,
      }),
    ]`
  ).replace(
    /babelHelpers: 'bundled'/g,
    `babelHelpers: 'runtime', plugins: [
      ['@babel/plugin-transform-runtime', {
        version: ${helpers ? `'${helpers}'` : 'undefined'}
      }]
    ]`
  );

  const globals = Object.entries<string>({
    ...current.amdNames,
    ...general.amdNames
  }).map(([key, value]) => {
    return null === value
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
    'pkg-main': true
  }).then(({ output }) => {
    console.log(output);
  });
}
