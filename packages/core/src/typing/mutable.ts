/**
 * Type helper marking the supplied type as mutable (opposed to readonly).
 *
 * @typeParam T - Type to be marked mutable.
 *
 * @see https://github.com/Microsoft/TypeScript/issues/24509
 */
export type Mutable<T extends object> = {
  -readonly [K in keyof T]: T[K];
};
