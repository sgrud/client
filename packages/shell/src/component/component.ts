import { customElements } from './registry';
import { createElement, render } from './runtime';

/**
 * Unique symbol used as property key by the [Component][] decorator to
 * associate the supplied constructor with its wrapper.
 *
 * [Component]: https://sgrud.github.io/client/functions/shell.Component
 */
export const component = Symbol('@sgrud/shell/component/component');

/**
 * Interface describing the shape of a **Component**. Mostly adheres to the
 * [WebComponents][] specification while providing rendering and change
 * detection capabilities.
 *
 * [WebComponents]: https://developer.mozilla.org/docs/Web/Web_Components
 */
export interface Component extends HTMLElement {

  /**
   * Array of [Attribute][] names, which should be observed for changes, which
   * will trigger the *attributeChangedCallback*.
   *
   * [Attribute]: https://sgrud.github.io/client/functions/shell.Attribute
   */
  readonly observedAttributes?: string[];

  /**
   * Mapping of [Reference][]s to observed events, which, when emitted by the
   * referenced node, trigger the *referenceChangedCallback*.
   *
   * [Reference]: https://sgrud.github.io/client/functions/shell.Reference
   */
  readonly observedReferences?: Record<JSX.Key, (keyof HTMLElementEventMap)[]>;

  /**
   * Internal readiness indication. Initially resolves to `undefined` and will
   * mirror the *isConnected* state, when ready.
   */
  readonly readyState?: boolean;

  /**
   * Array of CSS **styles** in string form, which should be included within the
   * shadow dom of the *Component*.
   */
  readonly styles?: string[];

  /**
   * [JSX][] representation of the *Component* **template**. If no template is
   * supplied, an [HTMLSlotElement][] will be rendered instead.
   *
   * [HTMLSlotElement]: https://developer.mozilla.org/docs/Web/API/HTMLSlotElement
   * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
   */
  readonly template?: JSX.Element;

  /**
   * Called when the *Component* is moved between documents.
   */
  adoptedCallback?(): void;

  /**
   * Called when one of the *Component*'s observed [Attribute][]s is added,
   * removed or changed. Which *Component* attributes are observed depends on
   * the contents of the *observedAttributes* array.
   *
   * [Attribute]: https://sgrud.github.io/client/functions/shell.Attribute
   *
   * @param name - Attribute name.
   * @param prev - Previous value.
   * @param next - Next value.
   */
  attributeChangedCallback?(name: string, prev?: string, next?: string): void;

  /**
   * Called when the *Component* is appended to or moved within the dom.
   */
  connectedCallback?(): void;

  /**
   * Called when the *Component* is removed from the dom.
   */
  disconnectedCallback?(): void;

  /**
   * Called when one of the *Component*'s [Reference][]d and observed nodes
   * emits an event. Which [Reference][]d nodes are observed for which events
   * depends on the contents of the *observedReferences* mapping.
   *
   * [Reference]: https://sgrud.github.io/client/functions/shell.Reference
   *
   * @param name - [Reference][] name.
   * @param event - Emitted event.
   */
  referenceChangedCallback?(name: string, node: Node, event: Event): void;

  /**
   * Called when the *Component* has changed and should be (re-)[render][]ed.
   *
   * [render]: https://sgrud.github.io/client/functions/shell.render
   */
  renderComponent?(): void;

}

/**
 * Class decorator factory. Registers the decorated class as **Component**
 * through the [customElements][] registry. Registered **Component**s can be
 * used in conjunction with the [Attribute][] and [Reference][] prototype
 * property decorators which will trigger the **Component** to re-[render][],
 * when one of the *observedAttributes* or *observedReferences* changes. While
 * any **Component** which is registered by this decorator is enriched with
 * basic rendering functionality, any implemented method will cancel out its
 * `super` logic.
 *
 * [customElements]: https://sgrud.github.io/client/variables/shell.customElements
 * [Attribute]: https://sgrud.github.io/client/functions/shell.Attribute
 * [Reference]: https://sgrud.github.io/client/functions/shell.Reference
 * [render]: https://sgrud.github.io/client/functions/shell.render
 *
 * @param selector - **Component** tag name.
 * @param inherits - Extended tag name.
 * @typeParam S - **Component** tag type.
 * @returns Class decorator.
 *
 * @example
 * Register a component:
 * ```tsx
 * import { Component } from '@sgrud/shell';
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
 *   public readonly styles: string[] = [`
 *     span {
 *       font-style: italic;
 *     }
 *   `];
 *
 *   public get template(): JSX.Element {
 *     return <span>Example component</span>;
 *   }
 *
 * }
 * ```
 *
 * @see [Attribute][]
 * @see [Reference][]
 */
export function Component<
  S extends CustomElementTagName,
  K extends HTMLElementTagName
>(selector: S, inherits?: K) {

  /**
   * @param constructor - Class constructor to be decorated.
   * @returns Decorated class constructor.
   */
  return function<T extends new () => Component & (
    HTMLElementTagNameMap[S] & HTMLElementTagNameMap[K]
  )>(
    constructor: T
  ): T {
    class Element extends (constructor as new () => Component) {

      public static readonly [component]: T = constructor;

      public static get observedAttributes(): string[] {
        return this.prototype.observedAttributes || [];
      }

      public constructor() {
        super();

        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
        }

        Object.defineProperty(this, 'readyState', {
          enumerable: true,
          get: () => this.isConnected
        });
      }

      public override adoptedCallback(): void {
        if (super.adoptedCallback) {
          super.adoptedCallback();
        } else {
          this.renderComponent();
        }
      }

      public override connectedCallback(): void {
        if (super.connectedCallback) {
          super.connectedCallback();
        } else {
          this.renderComponent();
        }
      }

      public override attributeChangedCallback(
        name: string,
        prev?: string,
        next?: string
      ): void {
        if (super.attributeChangedCallback) {
          super.attributeChangedCallback(name, prev, next);
        } else {
          this.renderComponent();
        }
      }

      public override referenceChangedCallback(
        name: string,
        node: Node,
        event: Event
      ): void {
        if (super.referenceChangedCallback) {
          super.referenceChangedCallback(name, node, event);
        } else {
          this.renderComponent();
        }
      }

      public override renderComponent(): void {
        if (super.renderComponent) {
          super.renderComponent();
        } else {
          const { styles = [], template = [] } = this;

          if (!template.length) {
            template.push(...createElement('slot'));
          }

          if (styles.length) {
            template.unshift(...createElement('style', {
              children: styles
            }));
          }

          render(this.shadowRoot!, template);
        }
      }

    }

    constructor.prototype[component] = Element;
    const options = inherits && { extends: inherits };
    customElements.define(selector, Element, options);
    return Element as unknown as T;
  };

}
