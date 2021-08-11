/* eslint-disable @typescript-eslint/no-var-requires */
import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs-extra';
import { dirname, join, relative, resolve } from 'path';
import { cli } from './cli';

cli.command('postbuild')
  .describe('Replicates exported package.json files in the SGRUD monorepo')
  .example('postbuild # Run with default options')
  .example('postbuild --cwd ./projects/sgrud # Run in ./projects/sgrud')
  .option('--cwd', 'Use an alternative working directory', './')
  .action((opts) => postbuild(opts));

/**
 * Replicates exported `package.json` files in the
 * {@link https://github.com/sgrud/client|SGRUD monorepo}.
 *
 * ```text
 * Description
 *   Replicates exported package.json files in the SGRUD monorepo
 *
 * Usage
 *   $ sgrud postbuild [options]
 *
 * Options
 *   --cwd         Use an alternative working directory  (default ./)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud postbuild # Run with default options
 *   $ sgrud postbuild --cwd ./projects/sgrud # Run in ./projects/sgrud
 * ```
 *
 * @param cwd - Use an alternative working directory. (default: `'./'`)
 *
 * @example Run with default options.
 * ```js
 * require('@sgrud/bin');
 * sgrud.postbuild();
 * ```
 *
 * @example Run in `./projects/sgrud`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.postbuild({ cwd: './projects/sgrud' });
 * ```
 */
export function postbuild({
  cwd = './'
}: {
  cwd?: string;
} = { }): void {
  const outDone = [];
  const pkgJson = require(resolve(cwd, 'package.json'));
  const srcHead = execSync('git rev-parse HEAD', { cwd }).toString().trim();

  for (const srcPath of pkgJson.exports as string[]) {
    const outList = { } as Record<string, string>;
    const srcFile = join(cwd, srcPath, 'package.json');
    const srcJson = require(resolve(srcFile));

    for (const key in srcJson) {
      switch (key) {
        case 'exports':
        case 'main':
        case 'module':
        case 'unpkg':
          if (existsSync(join(srcPath, srcJson[key]))) {
            outList[key] = srcJson[key];
          }
          break;

        case 'source':
          delete srcJson[key];
          break;
      }
    }

    for (const key in pkgJson) {
      switch (key) {
        case 'author':
        case 'bugs':
        case 'license':
          srcJson[key] = pkgJson[key];
          break;

        case 'homepage':
          srcJson[key] = join(
            pkgJson[key],
            'tree',
            srcHead.substr(0, 7),
            srcPath
          );
          break;

        case 'repository':
          srcJson[key] = pkgJson[key];
          srcJson[key].commit = srcHead;
          srcJson[key].directory = srcPath;
          break;
      }
    }

    if (Object.keys(outList).length) {
      const sorted = Object.values(outList).sort();
      const [a, b] = [dirname(sorted[0]), dirname(sorted[sorted.length - 1])];

      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      const outPath = join(srcPath, a.substring(0, i));
      const outFile = join(cwd, outPath, 'package.json');
      if (existsSync(outFile)) continue;

      for (const key in outList) {
        outList[key] = './' + relative(outPath, join(srcPath, outList[key]));
      }

      const outJson = JSON.stringify({ ...srcJson, ...outList });
      outDone.push([srcFile, outFile, outJson]);
    }
  }

  if (outDone.length) {
    console.log('Replicating exported package.json');
    const [_, g, b] = ['\x1b[0m', '\x1b[32m', '\x1b[34m'];
    for (const [srcFile, outFile, outJson] of outDone) {
      console.log(b, srcFile, g, '→', b, outFile, _);
      writeFileSync(outFile, outJson);
    }
  }
}
