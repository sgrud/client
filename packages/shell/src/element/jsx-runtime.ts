import { TypeOf } from '@sgrud/core';
import { elementClose, elementOpen, Key, text } from 'incremental-dom';

declare global {

  /**
   * Intrinsic JSX namespace containing the list of {@link IntrinsicElements}
   * and the JSX {@link Element} type.
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
     * Intrinsic list of JSX elements. Uses the global `HTMLElementTagNameMap`
     * while allowing to specify an element rendering key.
     */
    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: Partial<HTMLElementTagNameMap[K]> & {
        key?: Key;
      };
    };

  }

}

/**
 * @param type - Element type.
 * @param props - Element properties.
 * @param ref - Element rendering key.
 * @returns Array of `incremental-dom` calls.
 */
export function createElement(
  type: keyof JSX.IntrinsicElements | Function,
  props?: Record<string, any>,
  ref?: Key
): JSX.Element {
  if (TypeOf.function(type)) {
    return type(props);
  }

  const attributes = [];
  const children = [];
  const elements = [];

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

  elements.push(elementOpen.bind(null, type, ref, null, ...attributes));

  for (const child of children) {
    if (TypeOf.function(child)) {
      elements.push(child);
    } else {
      elements.push(text.bind(null, child));
    }
  }

  elements.push(elementClose.bind(null, type));

  return elements;
}

/**
 * @param props - Fragment properties.
 * @returns Array of `incremental-dom` calls.
 */
export function createFragment(props?: Record<string, any>): JSX.Element {
  return props?.children ? [props.children].flat(Infinity).filter(Boolean) : [];
}

export {
  createElement as jsx,
  createElement as jsxs,
  createFragment as Fragment
};
