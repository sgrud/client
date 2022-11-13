/**
 * Type helper marking the supplied type as **Mutable** (opposed to *readonly*).
 *
 * @typeParam T - Readonly type.
 *
 * @remarks https://github.com/Microsoft/TypeScript/issues/24509
 */
export type Mutable<T extends object> = {
  -readonly [K in keyof T]: T[K];
};
