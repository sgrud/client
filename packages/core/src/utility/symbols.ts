/**
 * Proxy around the built-in {@link Symbol} object, returning the requested
 * symbol or the name of the requested symbol prefixed with `'@@'`.
 */
const symbols = new Proxy(Symbol, {
  get: (_, propertyKey: keyof SymbolConstructor) => {
    return Symbol[propertyKey] || '@@' + propertyKey;
  }
});

export { symbols as Symbol };
