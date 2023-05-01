/* eslint-disable @typescript-eslint/unbound-method */

import { assign, Mutable } from '@sgrud/core';
import { Component } from './component';
import { references } from './runtime';

/**
 * {@link Component} prototype property decorator factory. Applying this
 * **Reference** decorator to a property of a registered {@link Component} while
 * supplying the `reference`ing {@link JSX.Key}] and, optionally, an array of
 * event names to `observe`, will replace the decorated property with a getter
 * returning the `reference`d node, once rendered. If an array of event names is
 * supplied, whenever one of those `observe`d events is emitted by the
 * `reference`d node, the {@link Component.referenceChangedCallback} of the
 * {@link Component} is called with the `reference` key, the `reference`d node
 * and the emitted event.
 *
 * @param reference - The `reference`ing {@link JSX.Key}.
 * @param observe - An array of event names to `observe`.
 * @returns A {@link Component} prototype property decorator.
 *
 * @example
 * **Reference** a node:
 * ```tsx
 * import { Component, Reference } from '@sgrud/shell';
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
 *   ⁠@Reference('example-key')
 *   private readonly span?: HTMLSpanElement;
 *
 *   public get template(): JSX.Element {
 *     return <span key="example-key"></span>;
 *   }
 *
 * }
 * ```
 *
 * @see {@link Component}
 */
export function Reference(
  reference: JSX.Key,
  observe?: (keyof HTMLElementEventMap)[]
) {

  /**
   * @param prototype - The {@link Component} `prototype` to be decorated.
   * @param propertyKey - The {@link Component} property to be decorated.
   */
  return function(prototype: Component, propertyKey: PropertyKey): void {
    if (!prototype.observedReferences) {
      const connectedCallback = prototype.connectedCallback;

      prototype.connectedCallback = function(this: Component): void {
        const listeners = {} as Record<JSX.Key, (event: Event) => void>;
        const renderComponent = this.renderComponent;

        this.renderComponent = function(this: Component): void {
          renderComponent?.call(this);
          const refs = references(this.shadowRoot!);

          if (refs) {
            for (const key in prototype.observedReferences) {
              const node = refs.get(key);

              if (node) {
                for (const type of prototype.observedReferences[key]) {
                  node.addEventListener(type, listeners[key] ||= (event) => {
                    this.referenceChangedCallback?.(key, node, event);
                  }, {
                    once: true,
                    passive: true
                  });
                }
              }
            }
          }
        };

        return connectedCallback
          ? connectedCallback.call(this)
          : this.renderComponent();
      };
    }

    assign((prototype as Mutable<Component>).observedReferences ||= {}, {
      [reference]: observe || []
    });

    Object.defineProperty(prototype, propertyKey, {
      enumerable: true,
      get(this: Component): Node | undefined {
        return references(this.shadowRoot!)?.get(reference);
      },
      set: Function.prototype as (...args: any[]) => any
    });
  };

}
