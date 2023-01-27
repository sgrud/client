#!/usr/bin/env node

/**
 * `@sgrud/bin` - The [SGRUD][] CLI.
 *
 * ```text
 * Description
 *   @sgrud/bin - The SGRUD CLI
 *
 * Usage
 *   $ sgrud <command> [options]
 *
 * Available Commands
 *   construct    Builds a SGRUD-based project using `microbundle`
 *   kickstart    Kickstarts a SGRUD-based project using `simple-git`
 *   postbuild    Replicates exported package metadata for SGRUD-based projects
 *   runtimify    Creates ESM or UMD bundles for ES6 modules using `microbundle`
 *   universal    Runs SGRUD in universal (SSR) mode using `puppeteer`
 *
 * For more info, run any command with the `--help` flag
 *   $ sgrud construct --help
 *   $ sgrud kickstart --help
 *
 * Options
 *   -v, --version    Displays current version
 *   -h, --help       Displays this message
 * ```
 *
 * [SGRUD]: https://sgrud.github.io
 *
 * @packageDocumentation
 */

import { cli } from './src/.cli';
import { construct } from './src/construct';
import { kickstart } from './src/kickstart';
import { postbuild } from './src/postbuild';
import { runtimify } from './src/runtimify';
import { universal } from './src/universal';

declare global {

  /**
   * Global [SGRUD][] namespace.
   *
  * [SGRUD]: https://sgrud.github.io
   */
  namespace sgrud {

    /**
     * `@sgrud/bin` - The [SGRUD][] CLI.
     *
     * [SGRUD]: https://sgrud.github.io
     */
    const bin: typeof module;

  }
}

const module = {
  construct,
  kickstart,
  postbuild,
  runtimify,
  universal
};

if (process.argv[1]?.endsWith('sgrud')) {
  cli.parse(process.argv);
} else {
  global.sgrud = { bin: module } as typeof sgrud;
}

export {
  construct,
  kickstart,
  postbuild,
  runtimify,
  universal
};
