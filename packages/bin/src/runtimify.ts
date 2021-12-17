/* eslint-disable @typescript-eslint/no-var-requires */

import { createWriteStream } from 'fs-extra';
import { join, relative, resolve } from 'path';
import { cli } from './.cli';

cli.command('runtimify <...modules>')
  .describe('Extracts and bundles runtime helpers using `microbundle`')
  .example('runtimify @babel/runtime:helpers # Runtimify `@babel/runtime`')
  .example('runtimify lit # Runtimify `lit`')
  .option('--cwd', 'Use an alternative working directory', './')
  .option('-o, --out', 'Output file within package root', 'runtimify.js')
  .action((_, opts) => runtimify({ ...opts, modules: opts._.concat(_) }));

/**
 * Extracts and bundles runtime helpers using
 * [microbundle](https://www.npmjs.com/package/microbundle).
 *
 * ```text
 * Description
 *   Extracts and bundles runtime helpers using `microbundle`
 *
 * Usage
 *   $ sgrud runtimify <...modules> [options]
 *
 * Options
 *   --cwd         Use an alternative working directory  (default ./)
 *   -o, --out     Output file within package root  (default runtimify.js)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud runtimify @babel/runtime:helpers # Runtimify `@babel/runtime`
 *   $ sgrud runtimify lit:!static # Runtimify `lit`
 * ```
 *
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example Runtimify `@babel/runtime`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.runtimify({ modules: ['@babel/runtime:helpers'] });
 * ```
 *
 * @example Runtimify `lit`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.runtimify({ modules: ['lit:!static'] });
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

  for (const pkg of modules.map((i) => i.split(':'))) {
    process.chdir(join(cwd, 'node_modules', pkg[0]));
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
