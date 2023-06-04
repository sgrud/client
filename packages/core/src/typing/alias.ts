/**
 * Type helper **Alias**ing any provided `T`ype. By looping a `T`ype through
 * this **Alias** type helper, the dereferencing of this `T`ype is prohibited.
 * Use this helper to, e.g., force a string literal type to be treated as an
 * unique type and not to be dereferenced.
 *
 * @typeParam T - The type that should be **Alias**ed.
 *
 * @example
 * **Alias** the `${number} ${'<' | '>'} ${number}` type:
 * ```ts
 * import { type Alias } from '@sgrud/core';
 *
 * type Helper = Alias<`${number} ${'<' | '>'} ${number}`>;
 *
 * const negative: Helper = '-01 < +0.1'; // negative: Helper
 * const positive: Helper = 'one is > 0'; // not assignable to type 'Helper'
 * ```
 *
 * @remarks https://github.com/microsoft/TypeScript/issues/47828
 */
export type Alias<T> = T | (T & { valueOf(): T });
