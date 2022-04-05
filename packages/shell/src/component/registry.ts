/**
 * Internal weak mapping of all registered elements to their name.
 */
const elements = new WeakMap<CustomElementConstructor, string>();

/**
 * Proxy around the built-in `customElements` object, maintaining a mapping of
 * all registered elements and their corresponding names, which can be queried
 * by calling `customElements.getName()`.
 *
 * @see https://github.com/WICG/webcomponents/issues/566
 */
const registry = new Proxy(customElements, {
  get: (_, propertyKey: keyof CustomElementRegistry | 'getName') => {
    switch (propertyKey) {
      case 'define': return (
        name: string,
        constructor: CustomElementConstructor,
        options?: ElementDefinitionOptions
      ) => {
        customElements.define(name, constructor, options);
        elements.set(constructor, name);
      };

      case 'getName': return (
        constructor: CustomElementConstructor
      ) => {
        let name = elements.get(constructor);

        if (!name) {
          try {
            name = Reflect.construct(HTMLElement, [], constructor).localName;
            elements.set(constructor, name as string);
          } catch {
            return undefined;
          }
        }

        return name;
      };

      default: return customElements[propertyKey].bind(customElements);
    }
  }
}) as CustomElementRegistry & {
  getName(constructor: CustomElementConstructor): string | undefined;
};

export { registry as customElements };
