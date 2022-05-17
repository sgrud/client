/* eslint-disable @typescript-eslint/no-var-requires */

import { Assign } from '@sgrud/core';
import { createWriteStream, readFileSync } from 'fs-extra';
import { Module } from 'module';
import { join, relative, resolve } from 'path';
import packageJson from '../package.json';
import { cli } from './.cli';

cli.command('runtimify [...modules]')
  .describe('Creates ESM or UMD bundles for ES6 modules using `microbundle`')
  .example('runtimify # Run with default options')
  .example('runtimify @microsoft/fast # Runtimify `@microsoft/fast`')
  .option('--format', 'Runtimify bundle format (umd or esm)', 'umd')
  .option('--output', 'Output file in module root', 'runtimify.[format].js')
  .option('--prefix', 'Use an alternative working directory', './')
  .action((_ = [], opts) => runtimify({ ...opts, modules: opts._.concat(_) }));

/**
 * Creates ESM or UMD bundles for ES6 modules using
 * [microbundle](https://www.npmjs.com/package/microbundle).
 *
 * ```text
 * Description
 *   Creates ESM or UMD bundles for ES6 modules using `microbundle`
 *
 * Usage
 *   $ sgrud runtimify [...modules] [options]
 *
 * Options
 *   --format      Runtimify bundle format (umd or esm)  (default umd)
 *   --output      Output file in module root  (default runtimify.[format].js)
 *   --prefix      Use an alternative working directory  (default ./)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud runtimify # Run with default options
 *   $ sgrud runtimify @microsoft/fast # Runtimify `@microsoft/fast`
 * ```
 *
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example Run with default options.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.runtimify();
 * ```
 *
 * @example Runtimify `@microsoft/fast`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.runtimify({ modules: ['@microsoft/fast'] });
 * ```
 */
export async function runtimify({
  format = 'umd',
  modules = [],
  output = 'runtimify.[format].js',
  prefix = './'
}: {

  /**
   * Runtimify bundle format (umd or esm).
   *
   * @defaultValue `'umd'`
   */
  format?: string;

  /**
   * Modules to runtimify.
   *
   * @defaultValue `[]`
   */
  modules?: string[];

  /**
   * Output file in module root.
   *
   * @defaultValue `'runtimify.[format].js'`
   */
  output?: string;

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  prefix?: string;

} = { }): Promise<void> {
  const bundler = require.resolve('microbundle');
  const patched = readFileSync(bundler).toString().replace(
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

  microbundle.filename = output;
  microbundle.paths = module.paths;
  microbundle._compile(patched, bundler);

  if ((
    prefix = resolve(prefix)
  ).startsWith(resolve(process.env.INIT_CWD!, 'node_modules'))) {
    prefix = process.env.INIT_CWD!;
  }

  if (!modules.length) {
    const module = require(resolve(prefix, 'package.json'));
    modules = module.sgrud?.runtimify || [];
    const submodules = module.sgrudDependencies
      ? Object.entries<string>(module.sgrudDependencies)
      : [] as [string, string][];

    for (const [name, version] of submodules) {
      const source = /^[./]/.exec(version)
        ? require(resolve(join(prefix, version, 'package.json')))
        : require(resolve(prefix, 'node_modules', name, 'package.json'));

      if (source.sgrud?.runtimify?.length) {
        modules.push(...source.sgrud.runtimify);
      }

      if (source.sgrudDependencies) {
        submodules.push(...Object.entries<string>(source.sgrudDependencies));
      }
    }
  }

  for (const origin of new Set(modules)) {
    const arr = origin.replace(/\.(esm|umd)+$/, (match) => {
      format = match ? match.substring(1) : 'umd';
      return '';
    }).split(':');

    output = microbundle.filename.replace('[format]', format);
    process.chdir(resolve(prefix, 'node_modules', arr[0]));

    const filter = arr.filter((i) => !i.startsWith('!'));
    const module = require(resolve('package.json'));
    const stream = createWriteStream(output);

    stream.cork();

    const write = (name: string, path: string) => {
      const source = resolve(relative(arr[0], path));

      if (name.startsWith(join(...arr)) || arr.some((i) => {
        return i.startsWith('!') && !name.startsWith(join(arr[0], i.slice(1)));
      })) {
        if (name === path) {
          stream.write(`export * from '${source}';`);
        } else {
          const naming = relative(join(...filter), name);
          const target = naming ? `* as ${naming}` : '*';
          stream.write(`export ${target} from '${source}';`);
        }
      }
    };

    if (Array.isArray(module.exports)) {
      module.exports.map((i: string) => write(arr[0], join(arr[0], i)));
    } else if (typeof module.exports === 'object') {
      for (const [key, value] of Object.entries<any>(module.exports)) {
        if (Array.isArray(value)) {
          const entry = value.find((i) => i.default)?.default;
          if (entry) write(join(arr[0], key), join(arr[0], entry));
        } else if (typeof value === 'object' && value?.default) {
          write(join(arr[0], key), join(arr[0], value.default));
        }
      }
    } else if (typeof module.exports === 'string') {
      write(arr[0], join(arr[0], module.exports));
    } else if (module.module && module.type === 'module') {
      write(arr[0], join(arr[0], module.module));
    } else if (module.main) {
      write(arr[0], join(arr[0], module.main));
    }

    stream.end();

    await new Promise((done) => setTimeout(done, 5000));

    await microbundle.exports({
      css: 'inline',
      'css-modules': false,
      cwd: process.cwd(),
      entries: [output],
      external: 'none',
      format,
      generateTypes: false,
      name: filter.flatMap((i) => i.split(/\W/)).filter(Boolean).join('.'),
      output,
      'pkg-main': false,
      workers: false
    }).then(({ output: result }) => {
      console.log(result);
    });
  }
}
