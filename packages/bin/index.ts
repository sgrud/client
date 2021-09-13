#!/usr/bin/env node

/**
 * `@sgrud/bin` - The [SGRUD](https://github.com/sgrud/client) CLI.
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
 *   kickstart    Kickstarts an angular, lit, preact or vue-based SGRUD project
 *   postbuild    Replicates exported package.json files in the SGRUD monorepo
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
 * @packageDocumentation
 */

import { cli } from './src/cli';
import { construct } from './src/construct';
import { kickstart } from './src/kickstart';
import { postbuild } from './src/postbuild';
import { universal } from './src/universal';

const sgrud = {
  construct,
  kickstart,
  postbuild,
  universal
};

if (process.argv[1]?.endsWith('sgrud')) {
  cli.parse(process.argv);
} else {
  global.sgrud = sgrud;
}

declare const global: typeof globalThis & {
  sgrud: typeof sgrud;
};

export {
  construct,
  kickstart,
  postbuild,
  universal
};
