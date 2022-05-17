import { TypeOf } from '@sgrud/core';
import { elementClose, elementOpen, getKey, patch, text } from 'incremental-dom';

declare global {

  /**
   * Global string literal helper type. Enforces any assigned string to be a
   * `keyof HTMLElementTagNameMap`, while excluding built-in tag names, i.e.,
   * `Extract`ing all `${string}-${string}` keys of `HTMLElementTagNameMap`.
   */
  type CustomElementTagName =
    Extract<keyof HTMLElementTagNameMap, `${string}-${string}`>;

  /**
   * Global string literal helper type. Enforces any assigned string to be a
   * `keyof HTMLElementTagNameMap`, while excluding all custom element tag
   * names, i.e., `${string}-${string}` keys of `HTMLElementTagNameMap`.
   */
  type HTMLElementTagName =
    Exclude<keyof HTMLElementTagNameMap, `${string}-${string}`>;

  /**
   * Intrinsic JSX namespace.
   *
   * @see https://www.typescriptlang.org/docs/handbook/jsx.html
   */
  namespace JSX {

    /**
     * Intrinsic JSX element type helper representing an array of bound
     * [incremental-dom](https://google.github.io/incremental-dom) calls.
     */
    type Element = (() => Node)[];

    /**
     * Intrinsic list of known JSX elements, comprised of the global
     * `HTMLElementTagNameMap`.
     */
    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: Partial<HTMLElementTagNameMap[K]> & {

        /**
         * Intrinsic built-in element extension attribute.
         */
        readonly is?: K extends HTMLElementTagName
          ? CustomElementTagName
          : never;

        /**
         * Intrinsic element reference key attribute.
         */
        readonly key?: Key;

      };
    };

    /**
     * Element reference key type helper. Enforces any assigned value to adhere
     * to the [incremental-dom](https://google.github.io/incremental-dom) `Key`
     * type.
     */
    type Key = string | number;

  }

  interface Node {

    /**
     * @see https://github.com/google/incremental-dom/pull/467
     */
    readonly namespaceURI: string | null;

  }

}

/**
 * JSX element factory. Provides `jsx-runtime`-compliant bindings to the
 * [incremental-dom](https://google.github.io/incremental-dom) library. This
 * factory function is meant to be implicitly imported by the transpiler and
 * returns an array of bound `incremental-dom` function calls, representing the
 * created JSX element. This array of bound functions can be rendered into an
 * element attached to the DOM through the {@link render} function.
 *
 * @param type - Element type.
 * @param props - Element properties.
 * @param ref - Element reference.
 * @returns Array of bound calls.
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
 * JSX fragment factory. Provides a `jsx-runtime`-compliant helper function used
 * by the transpiler to create JSX fragments.
 *
 * @param props - Fragment properties.
 * @returns Array of bound calls.
 */
export function createFragment(props?: Record<string, any>): JSX.Element {
  const fragment = [];

  if (props?.children?.length) {
    const children = props.children.flat(Infinity);

    for (const child of children) {
      if (TypeOf.string(child) || TypeOf.number(child)) {
        fragment.push(text.bind(null, child));
      } else if (TypeOf.function(child)) {
        fragment.push(child);
      }
    }
  }

  return fragment;
}

/**
 * JSX reference helper. Calling this function while supplying a viable `target`
 * will return all referenced JSX elements mapped by their corresponding keys
 * known to the supplied `target`. A viable `target` may be any element, which
 * previously was `target` to the {@link render} function.
 *
 * @param target - DOM element to resolve.
 * @returns Resolved references.
 */
export function references(
  target: DocumentFragment | Element
): Map<JSX.Key, Node> | undefined {
  return resolved.get(target);
}

/**
 * JSX rendering helper. This function is a wrapper around the `patch` function
 * from the [incremental-dom](https://google.github.io/incremental-dom) library
 * and renders a JSX element created through {@link createElement} into an
 * element attached to the DOM.
 *
 * @param target - DOM element to render into.
 * @param element - JSX element to be rendered.
 * @returns Rendered `target` element.
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
 * Internal weak mapping of all rendered nodes containing element references to
 * those references, mapped by their respective keys.
 */
const resolved = new WeakMap<DocumentFragment | Element, Map<JSX.Key, Node>>();

export {
  CustomElementTagName,
  HTMLElementTagName,
  JSX
};
