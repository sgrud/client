/* eslint-disable @typescript-eslint/no-var-requires */

import { createWriteStream } from 'fs-extra';
import { join, relative, resolve } from 'path';
import { cli } from './.cli';

cli.command('runtimify [...modules]')
  .describe('Creates UMD bundles for ES6 modules using `microbundle`')
  .example('runtimify # Run with default options')
  .example('runtimify @microsoft/fast # Runtimify `@microsoft/fast`')
  .option('--cwd', 'Use an alternative working directory', './')
  .option('-o, --out', 'Output file within package root', 'runtimify.js')
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
 *   -o, --out     Output file within package root  (default runtimify.js)
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

  for (const pkg of [...new Set(modules)].map((i) => i.split(':'))) {
    try {
      process.chdir(join(cwd, 'node_modules', pkg[0]));
    } catch {
      process.chdir(join(process.env.INIT_CWD!, 'node_modules', pkg[0]));
    }

    const { exports, main, module, type } = require(resolve('package.json'));
    const filter = pkg.filter((i) => !i.startsWith('!'));
    const stream = createWriteStream(out);
    stream.cork();

    const write = (name: string, file: string) => {
      const source = resolve(relative(pkg[0], file));

      if (name.startsWith(join(...pkg)) || pkg.some((i) => {
        return i.startsWith('!') && !name.startsWith(join(pkg[0], i.slice(1)));
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
      exports.map((i) => write(pkg[0], join(pkg[0], i)));
    } else if (typeof exports === 'object') {
      for (const [key, value] of Object.entries<any>(exports)) {
        if (Array.isArray(value)) {
          const entry = value.find((i) => i.default)?.default;
          if (entry) write(join(pkg[0], key), join(pkg[0], entry));
        } else if (typeof value === 'object' && value?.default) {
          write(join(pkg[0], key), join(pkg[0], value.default));
        }
      }
    } else if (typeof exports === 'string') {
      write(pkg[0], join(pkg[0], exports));
    } else if (module && type === 'module') {
      write(pkg[0], join(pkg[0], module));
    } else if (main) {
      write(pkg[0], join(pkg[0], main));
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
      format: 'umd',
      generateTypes: false,
      name: filter.flatMap((i) => i.split(/\W/)).filter(Boolean).join('.'),
      output: out,
      'pkg-main': false
    }).then(({ output }) => {
      console.log(output);
    });
  }
}
