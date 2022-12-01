const { JSX } = require('typedoc');

const source = /^\[([^\]]+)\]: (https?:\/\/\S+)$/gm;
const target = /\[([^\]]+)\]\[\]/gm;

exports.load = (app) => {
  app.converter.on('resolveBegin', (context) => resolveLinks(context));
  app.converter.on('resolveEnd', (context) => resolveLinks(context, true));

  app.renderer.hooks.on('head.end', () => {
    return JSX.createElement('style', undefined, JSX.createElement(JSX.Raw, {
      html: [
        'a.external[target=_blank] { background: none; padding: 0 }',
        'li[class^=tsd-kind]:not(.current) > ul { display: none; }'
      ].join(' ')
    }));
  });
};

function resolveLinks(context, warn) {
  for (const key in context.project.reflections) {
    const { comment } = context.project.reflections[key];

    if (comment) {
      const { blockTags, summary } = comment;
      const items = [...summary];
      const links = { };

      for (const { content } of blockTags) {
        items.push(...content);
      }

      for (const item of items) {
        for (const [match, ref, url] of item.text.matchAll(source)) {
          item.text = item.text.replace(match, '');
          links[ref] = url;
        }
      }

      for (const item of items) {
        for (const [match, ref] of item.text.matchAll(target)) {
          if (links[ref]) {
            item.text = item.text.replace(match, () => {
              return `<a href="${links[ref]}" target="${
                links[ref].includes('://sgrud.github.io') ? '_top' : '_blank'
              }">${ref}</a>`;
            });
          } else if (warn) {
            context.logger.warn([
              `Failed to resolve link to "${ref}" in comment for`,
              context.project.reflections[key].getFullName()
            ].join(' '));
          }
        }
      }
    }
  }
}
