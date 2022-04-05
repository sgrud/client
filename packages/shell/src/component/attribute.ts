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
 * @returns Component property decorator.
 *
 * @example Decorate a property.
 * ```tsx
 * import { Attribute, Component } from '@sgrud/shell';
 *
 * declare global {
 *   interface HTMLElementTagNameMap {
 *     'example-component': ExampleComponent;
 *   }
 * }
 *
 * @Component('example-component')
 * export class ExampleComponent extends HTMLElement implements Component {
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
   * @param component - Component prototype to be decorated.
   * @param propertyKey - Component property to be decorated.
   */
  return function(
    component: Component,
    propertyKey: PropertyKey
  ): void {
    const key = name || propertyKey as string;
    ((component as Mutable<Component>).observedAttributes ??= []).push(key);

    Object.defineProperty(component, propertyKey, {
      get(this: Component): string | undefined {
        return this.getAttribute(key) ?? undefined;
      },
      set(this: Component, value: string): void {
        if (this.readyState || !this.hasAttribute(key)) {
          this.setAttribute(key, value);
        }
      }
    });
  };

}
