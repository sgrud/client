import { Mutable } from '@sgrud/core';
import { Component } from './component';

/**
 * Prototype property decorator factory. Applying this decorator to a property
 * of a registered {@link Component} binds the decorated property to the
 * corresponding attribute of the custom component and adds the attribute to the
 * {@link observedAttributes} array. If no `name` parameter is supplied, the
 * name of the decorated property will be used instead. If both, a parameter
 * initializer and an initial attribute value are supplied, the attribute value
 * takes precedence.
 *
 * @param name - Component attribute name.
 * @returns Prototype property decorator.
 *
 * @example Decorate a property.
 * ```tsx
 * import { Attribute, Component } from '@sgrud/shell';
 *
 * @Component('example-component')
 * export class ExampleComponent extends HTMLElement {
 *
 *   @Attribute()
 *   public field?: string;
 *
 *   public get template(): JSX.Element {
 *     return <span>Attribute value: {this.field}</span>;
 *   }
 *
 * }
 * ```
 *
 * @see {@link Component}
 */
export function Attribute(name?: string) {

  /**
   * @param prototype - Prototype to be decorated.
   * @param propertyKey - Prototype property to be decorated.
   */
  return function(
    prototype: Component,
    propertyKey: PropertyKey
  ): void {
    const key = name || propertyKey as string;

    if (prototype.observedAttributes) {
      prototype.observedAttributes.push(key);
    } else {
      (prototype as Mutable<Component>).observedAttributes = [key];
    }

    Object.defineProperty(prototype, propertyKey, {
      get(this: Component): string | null {
        return this.getAttribute(key);
      },
      set(this: Component, value: string): void {
        if (this.shadowRoot || !this.hasAttribute(key)) {
          this.setAttribute(key, value);
        }
      }
    });
  };

}
