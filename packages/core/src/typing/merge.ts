/**
 * Type helper to convert union types (`A | B`) to intersection types (`A & B`).
 *
 * @typeParam T - The union type to **Merge**.
 *
 * @remarks https://github.com/microsoft/TypeScript/issues/29594
 */
export type Merge<T> =
  (T extends T ? (_: T) => T : never) extends (_: infer I) => T ? I : never;
