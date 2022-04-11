import { customElements } from './registry';
import { createElement, render } from './runtime';

/**
 * Interface describing the shape of a custom component. Mostly adheres to the
 * [specs](https://developer.mozilla.org/en-US/docs/Web/Web_Components) while
 * providing rendering and change detection capabilities.
 */
export interface Component extends HTMLElement {

  /**
   * Array of attribute names, which should be observed for changes, which will
   * trigger the {@link attributeChangedCallback}.
   *
   * @see {@link Attribute}
   */
  readonly observedAttributes?: string[];

  /**
   * Mapping of references to observed events, which, when emitted by the
   * referenced node, trigger the {@link referenceChangedCallback}.
   *
   * @see {@link Reference}
   */
  readonly observedReferences?: Record<JSX.Key, (keyof HTMLElementEventMap)[]>;

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
   * slot element will be rendered instead.
   */
  readonly template?: JSX.Element;

  /**
   * Called when the component is moved between documents.
   */
  adoptedCallback?(): void;

  /**
   * Called when one of the components observed attributes is added, removed or
   * changed. Which component attributes are observed depends on the contents of
   * the {@link observedAttributes} array.
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
   * Called when one of the components referenced and observed nodes emits an
   * event. Which referenced nodes are observed for which events depends on the
   * contents of the {@link observedReferences} mapping.
   *
   * @param name - Reference name.
   * @param event - Emitted event.
   */
  referenceChangedCallback?(name: string, node: Node, event: Event): void;

  /**
   * Called when the component has changed and should be (re-)rendered.
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
 * declare global {
 *   interface HTMLElementTagNameMap {
 *     'example-component': ExampleComponent;
 *   }
 * }
 *
 * @Component('example-component')
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
 * @see {@link Attribute}
 * @see {@link Reference}
 */
export function Component<
  S extends CustomElementTagName,
  R extends HTMLElementTagName
>(
  selector: S,
  inherits?: R
) {

  /**
   * @param constructor - Class constructor to be decorated.
   * @returns Decorated class constructor.
   */
  return function<T extends new () => Component & (
    HTMLElementTagNameMap[S] & HTMLElementTagNameMap[R]
  )>(
    constructor: T
  ): T {
    class Class extends (constructor as new () => Component) {

      public static get observedAttributes(): string[] {
        return this.prototype.observedAttributes || [];
      }

      public constructor() {
        super();

        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
        }

        Object.defineProperty(this, 'readyState', {
          get: () => this.isConnected
        });
      }

      public override adoptedCallback(): void {
        super.adoptedCallback
          ? super.adoptedCallback()
          : this.renderComponent();
      }

      public override connectedCallback(): void {
        super.connectedCallback
          ? super.connectedCallback()
          : this.renderComponent();
      }

      public override attributeChangedCallback(
        name: string,
        prev?: string,
        next?: string
      ): void {
        super.attributeChangedCallback
          ? super.attributeChangedCallback(name, prev, next)
          : this.renderComponent();
      }

      public override referenceChangedCallback(
        name: string,
        node: Node,
        event: Event
      ): void {
        super.referenceChangedCallback
          ? super.referenceChangedCallback(name, node, event)
          : this.renderComponent();
      }

      public override renderComponent(): void {
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

    const options = inherits && { extends: inherits };
    customElements.define(selector, Class, options);
    return Class as unknown as T;
  };

}
