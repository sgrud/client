import { Assign, TypeOf } from '@sgrud/core';
import { elementClose, elementOpen, getKey, patch, skip, text } from 'incremental-dom';
import { customElements } from './registry';

declare global {

  /**
   * String literal helper type. Enforces any assigned string to be a `keyof`
   * {@link HTMLElementTagNameMap}, while excluding built-in tag names, i.e.,
   * extracting `${string}-${string}` keys of the {@link HTMLElementTagNameMap}.
   *
   * @example
   * A valid **CustomElementTagName**:
   * ```tsx
   * const tagName: CustomElementTagName = 'example-component';
   * ```
   */
  type CustomElementTagName =
    Extract<keyof HTMLElementTagNameMap, `${string}-${string}`>;

  /**
   * String literal helper type. Enforces any assigned string to be a `keyof`
   * {@link HTMLElementTagNameMap}, while excluding custom element tag names,
   * i.e., `${string}-${string}` keys of the {@link HTMLElementTagNameMap}.
   *
   * @example
   * A valid **HTMLElementTagName**:
   * ```tsx
   * const tagName: HTMLElementTagName = 'div';
   * ```
   */
  type HTMLElementTagName =
    Exclude<keyof HTMLElementTagNameMap, `${string}-${string}`>;

  /**
   * The intrinsic [JSX](https://www.typescriptlang.org/docs/handbook/jsx.html)
   * namespace used by TypeScript to determine the {@link Element} type and all
   * valid {@link IntrinsicElements}.
   */
  namespace JSX {

    /**
     * Intrinsic {@link JSX} **Element** type helper representing an array of
     * bound {@link elementOpen} and {@link elementClose} calls.
     */
    type Element = (() => Node)[];

    /**
     * List of known {@link JSX} **IntrinsicElements**, comprised of the global
     * {@link HTMLElementTagNameMap}.
     */
    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: Partial<Assign<{

        /**
         * {@link Assign}ed **style** property allowing only {@link Partial}
         * {@link CSSStyleDeclaration}s or primitive strings to be passed.
         */
        readonly style?: string | Partial<CSSStyleDeclaration>;

      }, HTMLElementTagNameMap[K]>> & {

        /**
         * The **is** property specifies which custom element a built-in
         * {@link HTMLElement} extends.
         */
        readonly is?: K extends HTMLElementTagName
          ? CustomElementTagName
          : never;

        /**
         * The **key** property {@link references} elements and is later used to
         * access them through the {@link Reference} decorator.
         */
        readonly key?: Key;

      };
    };

    /**
     * **Key** {@link references} type helper. Enforces any assigned values to
     * be of a compatible **Key** type.
     */
    type Key = string | number;

  }

  interface Node {

    /**
     * @remarks https://github.com/google/incremental-dom/pull/467
     */
    readonly namespaceURI: string | null;

  }

}

/**
 * {@link JSX.Element} factory. Provides {@link JSX} runtime compliant bindings
 * creating arrays of bound {@link elementOpen} and {@link elementClose} calls.
 * This **createElement** factory function is meant to be implicitly imported by
 * the TypeScript transpiler through its {@link JSX} bindings and returns an
 * array of bound {@link elementOpen} and {@link elementClose} function calls,
 * representing the created {@link JSX.Element}. This array of bound functions
 * can be rendered into an element attached to the {@link Document} through the
 * {@link render} function.
 *
 * @param type - The `type` of {@link JSX.Element} to create.
 * @param props - Any properties to assign to the created {@link JSX.Element}.
 * @param ref - An optional `ref`erence to the created  {@link JSX.Element}.
 * @returns An array of bound functions representing the {@link JSX.Element}.
 *
 * @see {@link render}
 */
export function createElement(
  type: Function | keyof JSX.IntrinsicElements,
  props?: Record<string, any>,
  ref?: JSX.Key
): JSX.Element {
  if (TypeOf.function(type)) {
    return type(props);
  }

  const attributes = [];
  const children = [];
  const element = [];

  for (const key in props) {
    switch (key) {
      case 'children':
        children.push(...[props[key]].flat(Infinity));
        break;

      case 'className':
        attributes.push('class', props[key]);
        break;

      case 'is':
        type = customElements.get(props[key]) || type;
        break;

      case 'key':
        ref ??= props[key];
        break;

      default:
        attributes.push(key, props[key]);
        break;
    }
  }

  element.push(elementOpen.bind({}, type, ref, undefined, ...attributes));

  for (const child of children) {
    if (TypeOf.string(child) || TypeOf.number(child)) {
      element.push(text.bind({}, child));
    } else if (TypeOf.function(child)) {
      element.push(child);
    }
  }

  element.push(elementClose.bind({}, type as keyof JSX.IntrinsicElements));

  return element;
}

/**
 * {@link JSX} fragment factory. Provides a {@link JSX} runtime compliant helper
 * creating arrays of bound {@link elementOpen} and {@link elementClose} calls.
 * This **createFragment** factory function is meant to be implicitly imported
 * by the TypeScript transpiler through its {@link JSX} bindings and returns an
 * {@link JSX.Element} which can be rendered into an element attached to the
 * {@link Document} through the {@link render} function.
 *
 * @param props - Any properties to assign to the created {@link JSX.Element}.
 * @returns An array of bound functions representing the {@link JSX.Element}.
 */
export function createFragment(props?: Record<string, any>): JSX.Element {
  const children = [props?.children].flat(Infinity);
  const fragment = [];

  for (const child of children) {
    if (TypeOf.string(child) || TypeOf.number(child)) {
      fragment.push(text.bind({}, child));
    } else if (TypeOf.function(child)) {
      fragment.push(child);
    }
  }

  return fragment;
}

/**
 * Raw **html** rendering helper function. As {@link JSX} is pre-processed by
 * the TypeScript transpiler, assigning directly to the `innerHTML` property of
 * an {@link JSX.Element} will not result in the `innerHTML` to be rendered in
 * the {@link JSX.Element}. To insert raw **html** into an {@link JSX.Element}
 * this helper function has to be employed.
 *
 * @param contents - The raw **html** `contents` to {@link render}.
 * @param ref - An optional `ref`erence to the created  {@link JSX.Element}.
 * @returns An array of bound functions representing the {@link JSX.Element}.
 */
export function html(contents: string, ref?: JSX.Key): JSX.Element {
  return [() => {
    elementOpen('inner-html', ref, [
      'style', 'display: contents;'
    ], 'innerHTML', new String(contents));

    skip();
    return elementClose('inner-html');
  }];
}

/**
 * {@link JSX} **references** helper. Calling this function while supplying a
 * viable `outlet` will return all referenced {@link JSX.Element}s mapped by
 * their corresponding {@link JSX.Key}s known to the supplied `outlet`. A viable
 * `outlet` may be any element which previously was passed as `outlet` to the
 * {@link render} function.
 *
 * @param outlet - The `outlet` to return **references** for.
 * @returns Any **references** known to the supplied `outlet`.
 */
export function references(
  outlet: DocumentFragment | Element
): Map<JSX.Key, Node> | undefined {
  return rendered.get(outlet);
}

/**
 * {@link JSX} **render**ing helper. This helper is a small wrapper around the
 * {@link patch} function and **render**s a {@link JSX.Element} created through
 * the {@link createElement} factory into the supplied `outlet`.
 *
 * @param outlet - The `outlet` to **render** the `element` into.
 * @param element - {@link JSX} `element` to be **render**ed.
 * @returns **Render**ed `outlet` element.
 *
 * @see {@link createElement}
 */
export function render(
  outlet: DocumentFragment | Element,
  element: JSX.Element
): Node {
  return patch(outlet, () => {
    const refs = new Map<JSX.Key, Node>();

    for (const incrementalDom of element) {
      const node = incrementalDom();
      const ref = getKey(node);

      if (TypeOf.number(ref) || TypeOf.string(ref)) {
        refs.set(ref, node);
      }
    }

    if (refs.size) {
      rendered.set(outlet, refs);
    }
  });
}

/**
 * Internally used {@link WeakMap} of all rendered nodes containing element
 * references to those references, mapped by their respective {@link JSX.Key}s.
 */
const rendered = new WeakMap<DocumentFragment | Element, Map<JSX.Key, Node>>();

export {
  CustomElementTagName,
  HTMLElementTagName,
  JSX
};
