/**
 * Type helper **Assign**ing the own property types of all of the enumerable own
 * properties from a source type to a target type.
 *
 * @typeParam S - The source type to **Assign** from.
 * @typeParam T - The target type to **Assign** to.
 *
 * @example
 * **Assign** `valueOf()` to `string`:
 * ```ts
 * import { type Assign } from '@sgrud/core';
 *
 * const str = 'Hello world' as Assign<{
 *   valueOf(): 'Hello world';
 * }, string>;
 * ```
 */
export type Assign<S, T> = {
  /* eslint-disable @typescript-eslint/indent */

  [K in keyof (S & T)]:
    K extends keyof S ? S[K] :
    K extends keyof T ? T[K] :
    never;

  /* eslint-enable @typescript-eslint/indent */
};
