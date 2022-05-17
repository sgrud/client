/* eslint-disable @typescript-eslint/no-var-requires */

import { Assign } from '@sgrud/core';
import { readFileSync } from 'fs-extra';
import { Module } from 'module';
import { join, resolve } from 'path';
import packageJson from '../package.json';
import { cli } from './.cli';

cli.command('construct [...modules]')
  .describe('Builds a SGRUD-based project using `microbundle`')
  .example('construct # Run with default options')
  .example('construct ./project/module # Build ./project/module')
  .example('construct ./module --format umd # Build ./module as umd')
  .option('--compress', 'Compress/minify build output', true)
  .option('--format', 'Build specified formats', 'commonjs,modern,umd')
  .option('--prefix', 'Use an alternative working directory', './')
  .action((_ = [], opts) => construct({ ...opts, modules: opts._.concat(_) }));

/**
 * Builds a [SGRUD](https://github.com/sgrud/client)-based project using
 * [microbundle](https://www.npmjs.com/package/microbundle).
 *
 * ```text
 * Description
 *   Builds a SGRUD-based project using `microbundle`
 *
 * Usage
 *   $ sgrud construct [...modules] [options]
 *
 * Options
 *   --compress    Compress/minify build output  (default true)
 *   --format      Build specified formats  (default commonjs,modern,umd)
 *   --prefix      Use an alternative working directory  (default ./)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud construct # Run with default options
 *   $ sgrud construct ./project/module # Build ./project/module
 *   $ sgrud construct ./module --format umd # Build ./module as umd
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
 * @example Build `./project/module`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.construct({ modules: ['./project/module'] });
 * ```
 *
 * @example Build `./module` as `umd`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.construct({ modules: ['./module'], format: 'umd' });
 * ```
 */
export async function construct({
  compress = true,
  format = 'commonjs,modern,umd',
  modules = [],
  prefix = './'
}: {

  /**
   * Compress/minify build output.
   *
   * @defaultValue `true`
   */
  compress?: boolean;

  /**
   * Build specified formats.
   *
   * @defaultValue `'commonjs,modern,umd'`
   */
  format?: string;

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
  const bundler = require.resolve('microbundle');
  const patched = readFileSync(bundler).toString().replace(
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
        version: '${packageJson.dependencies['@babel/runtime']}'
      }]
    ]`
  );

  const microbundle = new Module('microbundle', module) as Assign<{
    _compile: (content: string, filename: string) => void;
    exports: (options: object) => Promise<{ output: string }>;
  }, InstanceType<typeof Module>>;

  microbundle.paths = module.paths;
  microbundle._compile(patched, bundler);

  if (!modules.length) {
    const module = require(resolve(prefix, 'package.json'));
    modules = module.sgrud?.construct || ['./'];
  }

  for (let i = 0; i < modules.length; i++) {
    const cwd = resolve(prefix, modules[i]);
    const source = require(resolve(cwd, 'package.json'));

    const globals = Object.entries(source.amdNames).map(([key, value]) => {
      return value === null
        ? `${key}=${key.split(/\W/).filter(Boolean).join('.')}`
        : `${key}=${value as string}`;
    }).join(',');

    const name = source.amdNames[source.name] === null
      ? source.name.split(/\W/).filter(Boolean).join('.')
      : source.amdNames[source.name];

    await microbundle.exports({
      compress,
      css: 'inline',
      'css-modules': false,
      cwd,
      format,
      globals,
      name,
      'pkg-main': true,
      workers: false
    }).then(({ output: result }) => {
      console.log(result);
    });

    if (source.sgrud?.construct?.length) {
      for (const submodule of source.sgrud.construct) {
        modules.splice(i + 1, 0, join(modules[i], submodule));
      }
    }
  }
}
