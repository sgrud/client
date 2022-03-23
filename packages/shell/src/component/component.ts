import { createElement, render } from './jsx-runtime';

/**
 * Interface describing the shape of a component.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Web_Components
 */
export interface Component extends HTMLElement {

  /**
   * Array of attribute names, which should be observed for changes, which will
   * trigger the {@link attributeChangedCallback}.
   */
  readonly observedAttributes?: string[];

  /**
   * Internal readiness indication. Initially resolves to `undefined` and will
   * mirror the `isConnected` state, when ready.
   */
  readonly readyState?: boolean;

  /**
   * Array of CSS strings, which should be included within the shadow dom of the
   * component.
   */
  readonly styles?: string[];

  /**
   * JSX representation of the component template. If no template is supplied, a
   * slot element will be rendered.
   */
  readonly template?: JSX.Element;

  /**
   * Called when the component is moved between documents.
   */
  adoptedCallback?(): void;

  /**
   * Called when one of the components attributes is added, removed or
   * changed. Which attributes to watch depends on the contents of the
   * {@link observedAttributes} array.
   *
   * @param name - Attribute name.
   * @param prev - Previous value.
   * @param next - Next value.
   */
  attributeChangedCallback?(name: string, prev?: string, next?: string): void;

  /**
   * Called when the component is appended to or moved within the dom.
   */
  connectedCallback?(): void;

  /**
   * Called when the component is removed from the dom.
   */
  disconnectedCallback?(): void;

  /**
   * Called when the component should be (re-)rendered.
   */
  renderComponent?(): void;

}

/**
 * Class decorator factory. Registers the decorated class as component with the
 * `CustomElementRegistry`. This decorator should be used in conjunction with
 * the {@link Attribute} prototype property decorator and will re-render, when a
 * bound property changes. While any custom component which is registered by
 * this decorator inherits basic rendering functionality, any overridden method
 * will cancel out its `super` logic. This ensures for a minimal and transparent
 * abstraction of the functionality the `CustomElementRegistry` provides, while
 * allowing for full customization.
 *
 * @param selector - Component tag name.
 * @param inherits - Extended tag name.
 * @typeParam S - Component tag type.
 * @returns Class decorator.
 *
 * @example Register a component.
 * ```tsx
 * import { Component } from '@sgrud/shell';
 *
 * @Component('example-component')
 * export class ExampleComponent extends HTMLElement {
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
 * @see {@link Attribute}
 */
export function Component<S extends keyof HTMLElementTagNameMap>(
  selector: `${string}-${string}`,
  inherits?: S
) {

  /**
   * @param constructor - Class constructor to be decorated.
   * @returns Decorated class constructor.
   */
  return function<T extends new () => Component & HTMLElementTagNameMap[S]>(
    constructor: T
  ): T {
    class Class extends (constructor as new () => Component) {

      public static get observedAttributes(): string[] {
        return this.prototype.observedAttributes || [];
      }

      public constructor() {
        super();

        Object.defineProperty(this, 'readyState', {
          get: () => this.isConnected
        });
      }

      public override attributeChangedCallback(
        name: string,
        prev?: string,
        next?: string
      ): void {
        if (super.attributeChangedCallback) {
          super.attributeChangedCallback(name, prev, next);
        } else if (this.shadowRoot) {
          this.renderComponent();
        }
      }

      public override connectedCallback(): void {
        if (super.connectedCallback) {
          super.connectedCallback();
        } else if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
          this.renderComponent();
        }
      }

      public override renderComponent(): void {
        if (super.renderComponent) {
          super.renderComponent();
        } else if (this.shadowRoot) {
          const { styles = [], template = [] } = this;

          if (!template.length) {
            template.push(...createElement('slot'));
          }

          if (styles.length) {
            template.push(...createElement('style', {
              children: styles
            }));
          }

          render(this.shadowRoot, template);
        }
      }

    }

    const options = inherits && { extends: inherits };
    customElements.define(selector, Class, options);
    return Class as unknown as T;
  };

}
