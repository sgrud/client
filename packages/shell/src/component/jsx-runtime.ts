import { TypeOf } from '@sgrud/core';
import { elementClose, elementOpen, text } from 'incremental-dom';

declare global {

  /**
   * Intrinsic JSX namespace.
   *
   * @see https://www.typescriptlang.org/docs/handbook/jsx.html
   */
  namespace JSX {

    /**
     * Intrinsic JSX element type helper representing an array of bound
     * `incremental-dom` calls.
     */
    type Element = (() => Node)[];

    /**
     * Intrinsic list of known JSX elements, comprised of the global
     * `HTMLElementTagNameMap`.
     */
    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: Partial<HTMLElementTagNameMap[K]> & {
        key?: string | number | null;
      };
    };

  }

}

/**
 * @param type - Element type.
 * @param props - Element properties.
 * @param ref - Element rendering key.
 * @returns Array of bound calls.
 */
export function createElement(
  type: keyof JSX.IntrinsicElements | Function,
  props?: Record<string, any>,
  ref?: string | number | null
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

export {
  JSX,
  createElement as jsx,
  createElement as jsxs,
  createFragment as Fragment
};
