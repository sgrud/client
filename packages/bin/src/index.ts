#!/usr/bin/env node

import { postbuild } from './postbuild';
import { universal } from './universal';

const sgrud = {
  postbuild,
  universal
};

try {
  if (process.argv[1]?.endsWith('sgrud')) {
    sgrud[process.argv[2] as keyof typeof sgrud]();
    process.exit(0);
  }
} catch {
  console.error('usage: sgrud ' + Object.keys(sgrud).join('|'));
  process.exit(1);
}

global.sgrud = sgrud;

declare const global: typeof globalThis & {
  sgrud: typeof sgrud;
};

export {
  postbuild,
  universal
};
