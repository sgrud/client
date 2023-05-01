const { homepage } = require('better-sqlite3/package.json');
const { JSDOM } = require('jsdom');

const { pathname } = new URL(homepage);
const { href } = new URL(pathname, 'https://raw.githubusercontent.com');
const { window } = new JSDOM(undefined, { url: href });
const request = new window.XMLHttpRequest();
const sources = 'master/docs/api.md';
const symbols = new Map();

request.open('GET', `${href}/${sources}`, false);
request.send();

if (request.status === 200) {
  const regex = new RegExp(`^- \\[([^\\]]+)\\]\\(([^\\)]+)\\)`, 'gm');
  let match;

  while (match = regex.exec(request.response)) {
    symbols.set(match[1], match[2]);
  }
}

/**
 * External symbol resolver for the `@types/better-sqlite3` package.
 *
 * @type {import('typedoc').ExternalSymbolResolver} An ExternalSymbolResolver.
 * @returns {import('typedoc').ExternalResolveResult | undefined} The result.
 */
module.exports = ({ moduleSource, symbolReference: { path } }, _refl, part) => {
  if (moduleSource === '@types/better-sqlite3') {
    const index = Number(path[0].path === 'BetterSqlite3');
    const name = path.slice(index).map((i) => i.path).join('#');

    for (const [key, value] of symbols) {
      if (key.includes(name)) {
        if (part?.text) {
          part.text = path[path.length - 1].path;
        }

        return {
          caption: path[path.length - 1].path,
          target: `${homepage}/blob/${sources}${value}`
        };
      }
    }
  }
};
