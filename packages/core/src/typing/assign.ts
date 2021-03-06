/* eslint-disable @typescript-eslint/indent */

/**
 * Type helper assigning the own property types of all of the enumerable own
 * properties from a source type to a target type.
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
export type Assign<S, T> = {
  [K in keyof (S & T)]:
    K extends keyof S ? S[K] :
    K extends keyof T ? T[K] :
    never;
};
