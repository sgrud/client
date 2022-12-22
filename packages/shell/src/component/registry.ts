/**
 * Internal mapping of all registered **elements** to their name.
 */
const elements = new Map<CustomElementConstructor, string>();

/**
 * Proxy around the built-in [customElements][] object, maintaining a mapping of
 * all registered elements and their corresponding names, which can be queried
 * by calling *getName*.
 *
 * [customElements]: https://developer.mozilla.org/docs/Web/API/Window/customElements
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
   * with the [customElements][] registry.
   *
   * [customElements]: https://developer.mozilla.org/docs/Web/API/Window/customElements
   *
   * @param constructor - Class constructor to be looked up.
   * @returns Name under which the `constructor` was registered, if.
   */
  getName(constructor: CustomElementConstructor): string | undefined;

};

export { registry as customElements };
