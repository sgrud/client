/**
 * Proxy around the built-in [Symbol][] object, returning the requested symbol
 * or the name of the requested symbol prefixed with `'@@'`.
 *
 * [Symbol]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol
 */
const symbols = new Proxy(Symbol, {
  get: (_, propertyKey: keyof SymbolConstructor) => {
    return Symbol[propertyKey] || '@@' + propertyKey;
  }
});

export { symbols as Symbol };
