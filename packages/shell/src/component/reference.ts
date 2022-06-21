import { assign, Mutable } from '@sgrud/core';
import { Component } from './component';
import { references } from './runtime';

/**
 * Prototype property decorator factory. Applying this decorator to a property
 * of a registered {@link Component} while supplying the `ref`erence key and,
 * optionally, an array of events to `observe`, will replace the decorated
 * property with a getter returning the referenced node, once rendered. If an
 * array of events is supplied, whenever one of those events is emitted by the
 * referenced node, the {@link referenceChangedCallback} is called with the
 * `ref`erence key, the referenced node and the emitted event.
 *
 * @param ref - Element reference.
 * @param observe - Events to observe.
 * @returns Component property decorator.
 *
 * @example Reference a node.
 * ```tsx
 * import { Component, Reference } from '@sgrud/shell';
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
 *   @Reference('example-key')
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
  ref: JSX.Key,
  observe?: (keyof HTMLElementEventMap)[]
) {

  /**
   * @param prototype - Component prototype to be decorated.
   * @param propertyKey - Component property to be decorated.
   */
  return function(
    prototype: Component,
    propertyKey: PropertyKey
  ): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const connectedCallback = prototype.connectedCallback;

    if (observe?.length) {
      assign((prototype as Mutable<Component>).observedReferences ||= { }, {
        [ref]: observe
      });
    }

    Object.defineProperty(prototype, propertyKey, {
      get(this: Component): Node | undefined {
        return references(this.shadowRoot!)?.get(ref);
      },
      set: Function.prototype as (...args: any[]) => void
    });

    prototype.connectedCallback = function(this: Component): void {
      if (this.observedReferences) {
        (this as Mutable<Component>).observedReferences = undefined;
        const listeners = { } as Record<JSX.Key, (event: Event) => void>;
        const renderComponent = this.renderComponent?.bind(this);

        this.renderComponent = function(this: Component): void {
          renderComponent?.();
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
      }

      return connectedCallback
        ? connectedCallback.call(this)
        : this.renderComponent?.();
    };
  };

}
