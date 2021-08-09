#!/usr/bin/env node

/**
 * `@sgrud/bin` - The SGRUD CLI.
 *
 * ```text
 * Description
 *   @sgrud/bin - The SGRUD CLI
 *
 * Usage
 *   $ sgrud <command> [options]
 *
 * Available Commands
 *   kickstart    Kickstarts an angular, lit, preact or vue-based SGRUD project
 *   postbuild    Replicates exported package.json files in the SGRUD monorepo
 *   universal    Runs SGRUD in universal (SSR) mode using `puppeteer`
 *
 * For more info, run any command with the `--help` flag
 *   $ sgrud kickstart --help
 *   $ sgrud postbuild --help
 *
 * Options
 *   -v, --version    Displays current version
 *   -h, --help       Displays this message
 * ```
 *
 * @packageDocumentation
 */

import { cli } from './src/cli';
import { kickstart } from './src/kickstart';
import { postbuild } from './src/postbuild';
import { universal } from './src/universal';

const sgrud = {
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
  kickstart,
  postbuild,
  universal
};
