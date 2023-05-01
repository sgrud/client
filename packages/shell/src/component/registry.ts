/**
 * Internal {@link Map}ping of all registered **elements** to their name.
 */
const elements = new Map<CustomElementConstructor, string>();

/**
 * {@link Proxy} around the built-in {@link CustomElementRegistry}, maintaining
 * a mapping of all registered elements and their corresponding names, which can
 * be queried by calling {@link registry.getName}.
 *
 * @remarks https://github.com/WICG/webcomponents/issues/566
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
            elements.set(constructor, name);
          } catch {
            return undefined;
          }
        }

        return name;
      };
    }

    return customElements[propertyKey].bind(customElements);
  }
}) as CustomElementRegistry & {

  /**
   * Retrieve the name under which the supplied `constructor` was registered
   * with the {@link CustomElementRegistry}.
   *
   * @param constructor - The class `constructor` to get the name for.
   * @returns The name under which the `constructor` was registered, if.
   */
  getName(constructor: CustomElementConstructor): string | undefined;

};

export { registry as customElements };
