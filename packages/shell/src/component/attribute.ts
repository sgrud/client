import { Mutable, TypeOf } from '@sgrud/core';
import { Component } from './component';

/**
 * {@link Component} prototype property decorator factory. Applying the
 * **Attribute** decorator to a property of a {@link Component} binds the
 * decorated property to the corresponding **Attribute** of the respective
 * {@link Component}. This implies that the **Attribute** `name` is appended to
 * the {@link Component.observedAttributes} array of the {@link Component} and
 * the decorated property is replaced with a getter and setter deferring those
 * operations to the **Attribute**. If no `name` supplied, the name of the
 * decorated property will be used instead. Further, if both, a parameter
 * initializer and an initial **Attribute** value are supplied, the
 * **Attribute** value takes precedence.
 *
 * @param name - The {@link Component} **Attribute** `name`.
 * @returns A {@link Component} prototype property decorator.
 *
 * @example
 * Bind a property to an **Attribute**:
 * ```tsx
 * import { Attribute, Component } from '@sgrud/shell';
 *
 * declare global {
 *   interface HTMLElementTagNameMap {
 *     'example-component': ExampleComponent;
 *   }
 * }
 *
 * ⁠@Component('example-component')
 * export class ExampleComponent extends HTMLElement implements Component {
 *
 *   ⁠@Attribute()
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
   * @param prototype - The {@link Component} `prototype` to be decorated.
   * @param propertyKey - The {@link Component} property to be decorated.
   */
  return function(prototype: Component, propertyKey: PropertyKey): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const connectedCallback = prototype.connectedCallback;
    const key = name || propertyKey as string;

    prototype.connectedCallback = function(this: Component): void {
      Object.defineProperty(this, propertyKey, {
        enumerable: true,
        get(this: Component): string | undefined {
          return this.getAttribute(key) ?? undefined;
        },
        set(this: Component, value: string): void {
          if (TypeOf.null(value) || TypeOf.undefined(value)) {
            this.removeAttribute(key);
          } else {
            this.setAttribute(key, value);
          }
        }
      });

      return connectedCallback
        ? connectedCallback.call(this)
        : this.renderComponent?.();
    };

    ((prototype as Mutable<Component>).observedAttributes ||= []).push(key);
  };

}
