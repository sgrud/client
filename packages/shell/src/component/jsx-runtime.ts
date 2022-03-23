import { TypeOf } from '@sgrud/core';
// @ts-expect-error https://github.com/TypeStrong/typedoc/pull/1891
import { elementClose, elementOpen, Key, patch, text } from 'incremental-dom';

declare global {

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
        key?: Key;
      };
    };

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
 * @param ref - Element rendering key.
 * @returns Array of bound calls.
 */
export function createElement(
  type: Function | keyof JSX.IntrinsicElements,
  props?: Record<string, any>,
  ref?: Key
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
        children.push(...[props[key]].flat(Infinity).filter(Boolean));
        break;

      case 'className':
        attributes.push('class', props[key]);
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
    if (TypeOf.function(child)) {
      element.push(child);
    } else {
      element.push(text.bind(null, child));
    }
  }

  element.push(elementClose.bind(null, type));

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

  if (props?.children) {
    fragment.push(...[props.children].flat(Infinity).filter(Boolean));
  }

  return fragment;
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
  target: Element | DocumentFragment,
  element: JSX.Element
): Node {
  return patch(target, () => {
    for (const incrementalDom of element) {
      incrementalDom();
    }
  });
}

export {
  JSX,
  createElement as jsx,
  createElement as jsxs,
  createFragment as Fragment
};
