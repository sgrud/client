import { Assign } from '@sgrud/core';
import { closeSync, openSync, readFileSync, writeSync } from 'fs';
import { Module } from 'module';
import { join, relative, resolve } from 'path';
import { dependencies } from '../package.json';
import { __, _b, _g, cli } from './.cli';

cli.command('runtimify [...modules]')
  .describe('Creates ESM or UMD bundles for node modules using `microbundle`')
  .example('runtimify # Run with default options')
  .example('runtimify @microsoft/fast # Runtimify `@microsoft/fast`')
  .option('--format', 'Runtimify bundle format (umd or esm)', 'umd')
  .option('--output', 'Output file in module root', 'runtimify.[format].js')
  .option('--prefix', 'Use an alternative working directory', './')
  .action((_ = [], opts) => runtimify({ ...opts, modules: opts._.concat(_) }));

/**
 * Creates ESM or UMD bundles for node modules using
 * [microbundle](https://github.com/developit/microbundle).
 *
 * ```text
 * Description
 *   Creates ESM or UMD bundles for node modules using `microbundle`
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
 * @param options - The `options` object.
 * @returns An execution {@link Promise}.
 *
 * @example
 * Run with default options (not recommended):
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.runtimify();
 * ```
 *
 * @example
 * **runtimify** `@microsoft/fast`:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.runtimify({
 *   modules: ['@microsoft/fast']
 * });
 * ```
 */
export async function runtimify({
  format = 'umd',
  modules = [],
  output = 'runtimify.[format].js',
  prefix = './'
}: {

  /**
   * **runtimify** bundle format (umd or esm).
   *
   * @defaultValue `'umd'`
   */
  format?: string;

  /**
   * Modules to **runtimify**.
   *
   * @defaultValue `package.json#sgrud.runtimify`
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

} = {}): Promise<void> {
  const bundler = require.resolve('microbundle');
  const patched = readFileSync(bundler).toString().replace(
    /babelHelpers: 'bundled'/g,
    `babelHelpers: 'runtime', plugins: [
      ['@babel/plugin-transform-runtime', {
        version: '${dependencies['@babel/runtime']}'
      }]
    ]`
  );

  const microbundle = new Module('microbundle', module) as Assign<{
    _compile: (content: string, filename: string) => void;
    exports: (options: object) => Promise<{ output: string }>;
  }, InstanceType<typeof Module>>;

  microbundle.paths = module.paths;
  microbundle._compile(patched, bundler);

  const config = {
    format,
    output
  };

  if ((
    prefix = resolve(prefix)
  ).startsWith(resolve(process.env.INIT_CWD!, 'node_modules'))) {
    prefix = process.env.INIT_CWD!;
  }

  if (!modules.length) {
    const sgrudDependencies = [];
    let module = require(resolve(prefix, 'package.json'));
    modules = module.sgrud?.runtimify || [];

    for (const key in module.sgrudDependencies) {
      sgrudDependencies.push([key, module.sgrudDependencies[key]]);
    }

    for (let i = 0; i < sgrudDependencies.length; i++) {
      const [id, version] = sgrudDependencies[i];

      if (version.startsWith('.')) {
        module = require(resolve(prefix, version, 'package.json'));
      } else if (version.startsWith('/')) {
        module = require(resolve(prefix, '.' + version, 'package.json'));
      } else {
        module = require(resolve(prefix, 'node_modules', id, 'package.json'));
      }

      if (module.sgrud?.runtimify?.length) {
        modules.push(...module.sgrud.runtimify);
      }

      for (const key in module.sgrudDependencies) {
        const value = module.sgrudDependencies[key];
        sgrudDependencies.splice(i + 1, 0, [key, value]);
      }
    }
  }

  for (const input of new Set(modules)) {
    const [id, scope = ''] = input.replace(/\.(esm|umd)+$/, (match) => {
      format = match ? match.slice(1) : config.format;
      return '';
    }).split(':');

    output = config.output.replace('[format]', format);
    process.chdir(resolve(prefix, 'node_modules', id));
    const file = openSync(output, 'w');

    const write = (name: string, path: string) => {
      const source = resolve(relative(id, path));

      if (name.startsWith(join(id, scope)) || (
        scope.startsWith('!') && !name.startsWith(join(id, scope.slice(1)))
      )) {
        if (name === path || (
          new RegExp(join(name, 'index') + '\\.[cm]?js').test(path)
        )) {
          writeSync(file, `export * from '${source}';`);
        } else {
          const namespace = relative(join(id, scope), name);
          const target = namespace ? '* as ' + namespace : '*';
          writeSync(file, `export ${target} from '${source}';`);
        }
      }
    };

    const { exports, main, module, type } = require(resolve('package.json'));
    let name = id.split(/\W/).filter(Boolean).join('.');

    if (scope && !scope.startsWith('!')) {
      name += '.' + scope.split(/\W/).filter(Boolean).join('.');
    }

    if (Array.isArray(exports)) {
      exports.map((i) => write(id, join(id, i)));
    } else if (typeof exports === 'object' && exports) {
      for (const [key, value] of Object.entries(exports)) {
        if (Array.isArray(value)) {
          const defaults = value.find((i) => i.default)?.default;
          if (defaults) write(join(id, key), join(id, defaults));
        } else if (typeof value === 'object' && value && 'default' in value) {
          write(join(id, key), join(id, value.default as string));
        }
      }
    } else if (typeof exports === 'string') {
      write(id, join(id, exports));
    } else if (module && type === 'module') {
      write(id, join(id, module));
    } else if (main) {
      write(id, join(id, main));
    }

    closeSync(file);

    console.log(
      _g, '[runtimify]',
      _b, id,
      _g, '→',
      _b, format,
      __
    );

    await microbundle.exports({
      css: 'inline',
      'css-modules': false,
      cwd: process.cwd(),
      entries: [output],
      external: 'none',
      format,
      generateTypes: false,
      name,
      output,
      'pkg-main': false,
      workers: false
    }).then(({ output: result }) => {
      console.log(
        _g, '[runtimify]',
        _b, result,
        __
      );
    });
  }
}
