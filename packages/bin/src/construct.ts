import { readFileSync } from 'fs-extra';
import { cli } from './cli';

cli.command('construct [...entries]')
  .describe('Builds a SGRUD-based project using `microbundle`')
  .example('construct # Run with default options')
  .example('construct ./project/main.ts # Build entry ./project/main.ts')
  .example('construct --cwd ./project --format umd # Build ./project as umd')
  .option('--cwd', 'Use an alternative working directory', './')
  .option('--entries', 'Entry modules to build  (default package.json#source)')
  .option('--format', 'Build specified formats', 'cjs,esm,modern,umd')
  .action((entries, opts) => construct({ entries, ...opts }));

/**
 * Builds a SGRUD-based project using
 * {@link https://www.npmjs.com/package/microbundle|microbundle}.
 *
 * ```text
 * Description
 *   Builds a SGRUD-based project using `microbundle`
 *
 * Usage
 *   $ sgrud construct [...entries] [options]
 *
 * Options
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
 * @param cwd - Use an alternative working directory. (default: `'./'`)
 * @param entries - Entry modules to build. (default: `package.json#source`)
 * @param format - Build specified formats. (default: `'cjs,esm,modern,umd'`)
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
export function construct({
  cwd = './',
  entries = undefined,
  format = 'cjs,esm,modern,umd'
}: {
  cwd?: string;
  entries?: [];
  format?: string;
} = { }): void {
  const resolve = require.resolve('microbundle');
  const patched = readFileSync(resolve).toString().replace(
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
  );

  const wrapper = new module.constructor();
  wrapper.paths = module.paths;
  wrapper._compile(patched, resolve);

  void (wrapper as {
    exports: (opts: Record<string, any>) => Promise<{ output: string }>;
  }).exports({
    compress: true,
    css: 'inline',
    'css-modules': false,
    cwd,
    entries,
    format,
    'pkg-main': true
  }).then(({ output }) => console.log(output));
}
