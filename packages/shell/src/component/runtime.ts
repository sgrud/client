import { TypeOf } from '@sgrud/core';
import { elementClose, elementOpen, getKey, patch, text } from 'incremental-dom';

declare global {

  /**
   * Global string literal helper type. Enforces any assigned string to be a
   * `keyof HTMLElementTagNameMap`, while excluding built-in tag names, i.e.,
   * extracting all `${string}-${string}` keys of `HTMLElementTagNameMap`.
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
   * Global string literal helper type. Enforces any assigned string to be a
   * `keyof HTMLElementTagNameMap`, while excluding custom element tag names,
   * i.e., all `${string}-${string}` keys of `HTMLElementTagNameMap`.
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
   * Intrinsic [JSX][] namespace.
   *
   * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
   */
  namespace JSX {

    /**
     * Intrinsic [JSX][] **element** type helper representing an array of bound
     * [incremental-dom][] calls.
     *
     * [incremental-dom]: https://google.github.io/incremental-dom
     * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
     */
    type Element = (() => Node)[];

    /**
     * Intrinsic list of known [JSX][] elements, comprised of the global
     * `HTMLElementTagNameMap`.
     *
     * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
     */
    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: Partial<HTMLElementTagNameMap[K]> & {

        /**
         * Intrinsic element extension.
         */
        readonly is?: K extends HTMLElementTagName
          ? CustomElementTagName
          : never;

        /**
         * Intrinsic element reference.
         */
        readonly key?: Key;

      };
    };

    /**
     * Element reference **Key** type helper. Enforces any assigned value to
     * to be a [incremental-dom][]-compatible **Key** type.
     *
     * [incremental-dom]: https://google.github.io/incremental-dom
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
 * [JSX][] element factory. Provides [JSX][] runtime-compliant bindings to the
 * [incremental-dom][] library. This factory function is meant to be implicitly
 * imported by the transpiler and returns an array of bound [incremental-dom][]
 * function calls, representing the created [JSX][] element. This array of bound
 * functions can be rendered into an element attached to the DOM through the
 * [render][] function.
 *
 * [incremental-dom]: https://google.github.io/incremental-dom
 * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
 * [render]: https://sgrud.github.io/client/functions/shell.render
 *
 * @param type - Element type.
 * @param props - Element properties.
 * @param ref - Element reference.
 * @returns Array of bound calls.
 *
 * @see [render][]
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

  element.push(elementOpen.bind(null, type, ref, null, ...attributes));

  for (const child of children) {
    if (TypeOf.string(child) || TypeOf.number(child)) {
      element.push(text.bind(null, child));
    } else if (TypeOf.function(child)) {
      element.push(child);
    }
  }

  element.push(elementClose.bind(null, type as keyof JSX.IntrinsicElements));

  return element;
}

/**
 * [JSX][] fragment factory. Provides a [JSX][] runtime-compliant helper
 * function used by the transpiler to create [JSX][] fragments.
 *
 * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
 *
 * @param props - Fragment properties.
 * @returns Array of bound calls.
 */
export function createFragment(props?: Record<string, any>): JSX.Element {
  const children = [props?.children].flat(Infinity);
  const fragment = [];

  for (const child of children) {
    if (TypeOf.string(child) || TypeOf.number(child)) {
      fragment.push(text.bind(null, child));
    } else if (TypeOf.function(child)) {
      fragment.push(child);
    }
  }

  return fragment;
}

/**
 * [JSX][] **references** helper. Calling this function while supplying a viable
 * `target` will return all referenced [JSX][] elements mapped by their
 * corresponding [Key][]s known to the supplied `target`. A viable `target` may
 * be any element, which previously was `target` to the [render][] function.
 *
 * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
 * [Key]: https://sgrud.github.io/client/types/shell.JSX.Key
 * [render]: https://sgrud.github.io/client/functions/shell.render
 *
 * @param target - Element to lookup **references** for.
 * @returns Resolved **references**.
 */
export function references(
  target: DocumentFragment | Element
): Map<JSX.Key, Node> | undefined {
  return resolved.get(target);
}

/**
 * [JSX][] **render**ing helper. This helper is a wrapper around the *patch*
 * function from the [incremental-dom][] library and **render**s a [JSX][]
 * `element` created through [createElement][] into an `target` element or
 * fragment.
 *
 * [createElement]: https://sgrud.github.io/client/functions/shell.createElement
 * [incremental-dom]: https://google.github.io/incremental-dom
 * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
 *
 * @param target - Element or fragment to **render** into.
 * @param element - [JSX][] element to be **render**ed.
 * @returns **Render**ed `target` element.
 *
 * @see [createElement][]
 */
export function render(
  target: DocumentFragment | Element,
  element: JSX.Element
): Node {
  return patch(target, () => {
    const refs = new Map<JSX.Key, Node>();

    for (const incrementalDom of element) {
      const node = incrementalDom();
      const ref = getKey(node);

      if (TypeOf.number(ref) || TypeOf.string(ref)) {
        refs.set(ref, node);
      }
    }

    if (refs.size) {
      resolved.set(target, refs);
    }
  });
}

/**
 * Internally used mapping of all rendered nodes containing element references
 * to those references, mapped by their respective [Key][]s.
 *
 * [Key]: https://sgrud.github.io/client/types/shell.JSX.Key
 */
const resolved = new WeakMap<DocumentFragment | Element, Map<JSX.Key, Node>>();

export {
  CustomElementTagName,
  HTMLElementTagName,
  JSX
};
