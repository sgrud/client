/**
 * Type helper to convert union types (`A | B`) to intersection types (`A & B`).
 *
 * @typeParam U - Union type.
 *
 * @see https://github.com/microsoft/TypeScript/issues/29594
 */
export type UnSec<U>
  = (U extends U ? (_: U) => U : never) extends (_: infer I) => U ? I : never;
