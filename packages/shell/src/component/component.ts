import { Subscription } from 'rxjs';
import { customElements } from './registry';
import { createElement, render } from './runtime';

/**
 * Unique symbol used as property key by the {@link Component} decorator to
 * associate the supplied constructor with its wrapper.
 */
export const component = Symbol('@sgrud/shell/component/component');

/**
 * An interface describing the shape of a **Component**. Mostly adheres to the
 * [Web Components](https://developer.mozilla.org/docs/Web/API/Web_components)
 * specification while providing rendering and change detection capabilities.
 */
export interface Component extends HTMLElement {

  /**
   * Array of {@link Attribute} names, which should be observed for changes,
   * which will trigger the {@link attributeChangedCallback}.
   */
  readonly observedAttributes?: string[];

  /**
   * A {@link Record} of {@link Subscription}s opened by the {@link Fluctuate}
   * decorator which trigger the {@link fluctuationChangedCallback} upon each
   * emission, while subscribed to.
   */
  readonly observedFluctuations?: Record<PropertyKey, Subscription>;

  /**
   * A {@link Record} of {@link Reference}s and observed events, which, when
   * emitted by the reference, trigger the {@link referenceChangedCallback}.
   */
  readonly observedReferences?: Record<JSX.Key, (keyof HTMLElementEventMap)[]>;

  /**
   * Array of CSS **styles** in string form, which should be included within the
   * {@link ShadowRoot} of the {@link Component}.
   */
  readonly styles?: string[];

  /**
   * {@link JSX} representation of the {@link Component} **template**. If no
   * template is supplied, an {@link HTMLSlotElement} will be rendered instead.
   */
  readonly template?: JSX.Element;

  /**
   * Called when the {@link Component} is moved between {@link Document}s.
   */
  adoptedCallback?(): void;

  /**
   * Called when one of the {@link Component}'s observed {@link Attribute}s is
   * added, removed or changed. Which {@link Component} attributes are observed
   * depends on the contents of the {@link observedAttributes} array.
   *
   * @param name - The `name` of the changed attribute.
   * @param prev - The `prev`ious value of the changed attribute.
   * @param next - The `next` value of the changed attribute.
   */
  attributeChangedCallback?(name: string, prev?: string, next?: string): void;

  /**
   * Called when the {@link Component} is appended to the {@link Document}.
   */
  connectedCallback?(): void;

  /**
   * Called when the {@link Component} is removed from the {@link Document}.
   */
  disconnectedCallback?(): void;

  /**
   * This callback is invoked whenever a {@link Component} {@link Fluctuate}s,
   * i.e., if the any of its decorated `propertyKey`s is assigned the `next`
   * value emitted by one of the {@link observedFluctuations}.
   *
   * @param propertyKey - The `propertyKey` that {@link Fluctuate}d.
   * @param next - The `prev`ious value of the {@link Fluctuate}d `propertyKey`.
   * @param next - The `next` value of the {@link Fluctuate}d `propertyKey`.
   */
  fluctuationChangedCallback?(
    propertyKey: PropertyKey,
    prev: unknown,
    next: unknown
  ): void;

  /**
   * Called when one of the {@link Component}'s {@link Reference}d and observed
   * nodes emits an event. Which {@link Reference}d nodes are observed for which
   * events depends on the contents of the {@link observedReferences} mapping.
   *
   * @param key - The `key` used to {@link Reference} the `node`.
   * @param node - The {@link Reference}d `node`.
   * @param event - The `event` emitted by the `node`.
   */
  referenceChangedCallback?(key: JSX.Key, node: Node, event: Event): void;

  /**
   * Called when the {@link Component} has changed and should {@link render}.
   */
  renderComponent?(): void;

}

/**
 * Class decorator factory. Registers the decorated class as **Component**
 * through the {@link customElements} registry. Registered **Component**s can be
 * used in conjunction with any of the {@link Attribute}, {@link Fluctuate} and
 * {@link Reference} prototype property decorators which will trigger their
 * respective callbacks or {@link Component.renderComponent} whenever one of the
 * {@link Component.observedAttributes}, {@link Component.observedFluctuations}
 * or {@link Component.observedReferences} changes. While any **Component**
 * registered by this decorator is enriched with basic rendering functionality,
 * any implemented method will cancel out its `super` logic.
 *
 * @param selector - The custom **Component** tag name `selector`.
 * @param inherits - The {@link HTMLElement} this **Component** `inherits` from.
 * @typeParam S - The custom **Component** tag name `selector` type.
 * @returns A class constructor decorator.
 *
 * @example
 * Register a **Component**:
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
 * @see {@link Attribute}
 * @see {@link Reference}
 */
export function Component<
  S extends CustomElementTagName,
  K extends HTMLElementTagName
>(selector: S, inherits?: K) {

  /**
   * @param constructor - The class `constructor` to be decorated.
   * @returns The decorated class `constructor`.
   */
  return function<T extends new () => Component & (
    HTMLElementTagNameMap[S] & HTMLElementTagNameMap[K]
  )>(
    constructor: T
  ): T {
    class Element extends (constructor as new () => Component) {

      public static readonly [component]: T = constructor;

      public static get observedAttributes(): string[] | undefined {
        return this.prototype.observedAttributes;
      }

      public constructor() {
        super();

        if (!this.shadowRoot) {
          this.attachShadow({
            mode: 'open'
          });
        }
      }

      public override connectedCallback(): void {
        if (super.connectedCallback) {
          super.connectedCallback();
        } else if (this.isConnected) {
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
        } else if (this.isConnected) {
          this.renderComponent();
        }
      }

      public override fluctuationChangedCallback(
        propertyKey: PropertyKey,
        prev: unknown,
        next: unknown
      ): void {
        if (super.fluctuationChangedCallback) {
          super.fluctuationChangedCallback(propertyKey, prev, next);
        } else if (this.isConnected) {
          this.renderComponent();
        }
      }

      public override referenceChangedCallback(
        key: JSX.Key,
        node: Node,
        event: Event
      ): void {
        if (super.referenceChangedCallback) {
          super.referenceChangedCallback(key, node, event);
        } else if (this.isConnected) {
          this.renderComponent();
        }
      }

      public override renderComponent(): void {
        if (super.renderComponent) {
          super.renderComponent();
        } else if (this.isConnected) {
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
