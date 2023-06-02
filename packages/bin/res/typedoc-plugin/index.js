const { readdirSync } = require('fs');
const { join, parse, sep } = require('path');
const { Converter, ReflectionKind } = require('typedoc');

/**
 * Plugin for the [TypeDoc](https://typedoc.org) documentation processor. This
 * plugin will align `@link` tags within the [SGRUD](https://sgrud.github.io)
 * monorepo layout to top-level module exports. Furthermore, this plugin will
 * retry resolving locally evaluated foreign module `@link`s in their own scope
 * while utilizing any file found within the `'./resolver'` path relative to
 * this file as external resolver.
 *
 * @param {import('typedoc').Application} app - A TypeDoc application reference.
 */
exports.load = (app) => {
  const reflections = [];

  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    for (const reflection of context.project.children) {
      if (reflection.kind === ReflectionKind.Module) {
        reflections.push(...reflection.children);
      }
    }
  });

  app.converter.addUnknownSymbolResolver((ref, refl, part, symbolId) => {
    if (!ref.moduleSource && symbolId) {
      const path = symbolId.fileName.split(sep);
      let index = path.indexOf('node_modules');

      if (index > 0) {
        ref.moduleSource = path[++index];
        ref.resolutionStart = 'global';

        if (ref.moduleSource.startsWith('@')) {
          ref.moduleSource += '/' + path[++index];
        }

        return app.converter.resolveExternalLink(ref, refl, part, symbolId);
      }
    }

    if (ref.resolutionStart === 'local') {
      let symbols = reflections;

      for (let index = 0; index < ref.symbolReference.path.length; index++) {
        const children = [];

        for (const symbol of symbols) {
          if (symbol.name === ref.symbolReference.path[index].path) {
            if (index === ref.symbolReference.path.length - 1) {
              return {
                caption: symbol.name,
                target: symbol
              };
            } else if (symbol.children?.length) {
              children.push(...symbol.children);
            }
          }
        }

        symbols = children;
      }
    }
  });

  for (let resolver of readdirSync(join(__dirname, 'resolver'))) {
    try {
      resolver = require(join(__dirname, 'resolver', resolver));
      app.converter.addUnknownSymbolResolver(resolver);
    } catch {
      resolver = parse(resolver).name;
      app.logger.warn(`Failed to load the ${resolver} subresolver`);
    }
  }
};
