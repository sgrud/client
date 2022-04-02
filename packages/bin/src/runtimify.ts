/* eslint-disable @typescript-eslint/no-var-requires */

import { createWriteStream } from 'fs-extra';
import { join, relative, resolve } from 'path';
import { cli } from './.cli';

cli.command('runtimify [...modules]')
  .describe('Creates UMD bundles for ES6 modules using `microbundle`')
  .example('runtimify # Run with default options')
  .example('runtimify @microsoft/fast # Runtimify `@microsoft/fast`')
  .option('--cwd', 'Use an alternative working directory', './')
  .option('--format', 'Runtimify bundle format (umd or esm)', 'umd')
  .option('--out', 'Output file within package root', 'runtimify.js')
  .action((_ = [], opts) => runtimify({ ...opts, modules: opts._.concat(_) }));

/**
 * Creates UMD bundles for ES6 modules using
 * [microbundle](https://www.npmjs.com/package/microbundle).
 *
 * ```text
 * Description
 *   Creates UMD bundles for ES6 modules using `microbundle`
 *
 * Usage
 *   $ sgrud runtimify [...modules] [options]
 *
 * Options
 *   --cwd         Use an alternative working directory  (default ./)
 *   --format      Runtimify bundle format (umd or esm)  (default umd)
 *   --out         Output file within package root  (default runtimify.js)
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
  cwd = './',
  format = 'umd',
  modules = [],
  out = 'runtimify.js'
}: {

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  cwd?: string;

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
   * Output file within package root.
   *
   * @defaultValue `'runtimify.js'`
   */
  out?: string;

} = { }): Promise<void> {
  cwd = resolve(cwd);

  if (!modules.length) {
    const pkg = require(resolve(join(cwd, 'package.json')));

    if ('runtimify' in pkg) {
      modules.push(...pkg.runtimify);
    }
  }

  for (const pkg of [...new Set(modules)]) {
    const src = pkg.replace(/\.(esm|umd)+$/, (match) => {
      if (match) format = match.substring(1);
      return '';
    }).split(':');

    try {
      process.chdir(join(cwd, 'node_modules', src[0]));
    } catch {
      process.chdir(join(process.env.INIT_CWD!, 'node_modules', src[0]));
    }

    const { exports, main, module, type } = require(resolve('package.json'));
    const filter = src.filter((i) => !i.startsWith('!'));
    const stream = createWriteStream(out);
    stream.cork();

    const write = (name: string, file: string) => {
      const source = resolve(relative(src[0], file));

      if (name.startsWith(join(...src)) || src.some((i) => {
        return i.startsWith('!') && !name.startsWith(join(src[0], i.slice(1)));
      })) {
        if (name === file) {
          stream.write(`export * from '${source}';`);
        } else {
          const naming = relative(join(...filter), name);
          const target = naming ? `* as ${naming}` : '*';
          stream.write(`export ${target} from '${source}';`);
        }
      }
    };

    if (Array.isArray(exports)) {
      exports.map((i) => write(src[0], join(src[0], i)));
    } else if (typeof exports === 'object') {
      for (const [key, value] of Object.entries<any>(exports)) {
        if (Array.isArray(value)) {
          const entry = value.find((i) => i.default)?.default;
          if (entry) write(join(src[0], key), join(src[0], entry));
        } else if (typeof value === 'object' && value?.default) {
          write(join(src[0], key), join(src[0], value.default));
        }
      }
    } else if (typeof exports === 'string') {
      write(src[0], join(src[0], exports));
    } else if (module && type === 'module') {
      write(src[0], join(src[0], module));
    } else if (main) {
      write(src[0], join(src[0], main));
    }

    stream.end();

    await (require('microbundle') as (opts: object) => Promise<{
      output: string;
    }>)({
      compress: true,
      css: 'inline',
      'css-modules': false,
      cwd: process.cwd(),
      entries: [out],
      external: 'none',
      format,
      generateTypes: false,
      name: filter.flatMap((i) => i.split(/\W/)).filter(Boolean).join('.'),
      output: out,
      'pkg-main': false,
      workers: false
    }).then(({ output }) => {
      console.log(output);
    });
  }
}
