import { Mutable } from '@sgrud/core';
import { Component } from './component';

/**
 * [Component][] prototype property decorator factory. Applying the
 * **Attribute** decorator to a property of a [Component][] binds the decorated
 * property to the corresponding attribute of the respective [Component][]. This
 * implies that the attribute `name` is added to the *observedAttributes* array
 * of the [Component][] and the decorated property is replaced with a getter and
 * setter deferring those operations to the attribute. If no `name` supplied,
 * the name of the decorated property will be used instead. Further, if both, a
 * parameter initializer and an initial attribute value are supplied, the
 * attribute value takes precedence.
 *
 * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
 *
 * @param name - [Component][] attribute name.
 * @returns [Component][] prototype property decorator.
 *
 * @example
 * Decorate a property:
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
 * @see [Component][]
 */
export function Attribute(name?: string) {

  /**
   * @param prototype - [Component][] prototype to be decorated.
   * @param propertyKey - [Component][] property to be decorated.
   *
   * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
   */
  return function(
    prototype: Component,
    propertyKey: PropertyKey
  ): void {
    const key = name || propertyKey as string;
    ((prototype as Mutable<Component>).observedAttributes ||= []).push(key);

    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
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
