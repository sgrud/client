import { Merge } from './merge';
import { TypeOf } from './type-of';

/**
 * Assigns the own property types of all of the enumerable own properties from a
 * source type to a target type.
 *
 * @typeParam S - Source type.
 * @typeParam T - Target type.
 *
 * @example Assign `valueOf()` to `string`.
 * ```ts
 * import type { Assign } from '@sgrud/core';
 *
 * const str = 'Hello world' as Assign<{
 *   valueOf(): 'Hello world';
 * }, string>;
 * ```
 */
/* eslint-disable @typescript-eslint/indent */
export type Assign<S, T> = {
  [K in keyof (S & T)]:
    K extends keyof S ? S[K] :
    K extends keyof T ? T[K] :
    never;
};
/* eslint-enable @typescript-eslint/indent */

/**
 * Deep copy the values of all of the enumerable own properties from one or more
 * source objects to a target object. Returns the target object.
 *
 * @param target - Target object to deep copy properties to.
 * @param sources - Source objects from which to deep copy properties.
 * @typeParam T - Target type.
 * @typeParam S - Source types.
 * @returns Target object.
 *
 * @example Deep copy nested properties.
 * ```ts
 * import { assign } from '@sgrud/core';
 *
 * assign(
 *   { one: { one: true }, two: false },
 *   { one: { key: null } },
 *   { two: true }
 * );
 *
 * // { one: { one: true, key: null }, two: true },
 * ```
 */
export function assign<
  T extends Record<PropertyKey, any>,
  S extends Record<PropertyKey, any>[]
>(target: T, ...sources: [...S]): T & Merge<S[number]> {
  for (const source of sources) {
    for (const key in source) {
      if (TypeOf.object(target[key]) && TypeOf.object(source[key])) {
        target[key] = assign({ ...target[key] }, source[key]);
      } else {
        target[key] = source[key] as T[S[number][PropertyKey]];
      }
    }
  }

  return target as T & Merge<S[number]>;
}
