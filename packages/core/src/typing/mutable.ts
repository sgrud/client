/**
 * Type helper marking the supplied type as **Mutable** (opposed to `readonly`).
 *
 * @typeParam T - The readonly type to make **Mutable**.
 *
 * @remarks https://github.com/Microsoft/TypeScript/issues/24509
 */
export type Mutable<T extends object> = {
  -readonly [K in keyof T]: T[K];
};
