const { JSDOM } = require('jsdom');
const { homepage } = require('rxjs/package.json');

const { window } = new JSDOM(undefined, { url: homepage });
const apiList = 'generated/docs/api/api-list.json';
const request = new window.XMLHttpRequest();
const symbols = new Map();

request.open('GET', `${homepage}/${apiList}`, false);
request.send();

if (request.status === 200) {
  for (const { items } of JSON.parse(request.response)) {
    for (const item of items) {
      if (!symbols.has(item.title)) {
        symbols.set(item.title, `${homepage}/${item.path}`);
      }
    }
  }
}

/**
 * External symbol resolver for the `rxjs` package.
 *
 * @type {import('typedoc').ExternalSymbolResolver} An ExternalSymbolResolver.
 * @returns {import('typedoc').ExternalResolveResult | undefined} The result.
 */
module.exports = ({ moduleSource, symbolReference: { path } }) => {
  if (moduleSource === 'rxjs' && symbols.has(path[0].path)) {
    return {
      caption: path[0].path,
      target: symbols.get(path[0].path)
    };
  }
};
