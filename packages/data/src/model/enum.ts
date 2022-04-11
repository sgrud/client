/**
 * Abstract Enum helper class. This class is used by the {@link Model.unravel}
 * method to detect enumerations within a {@link Model.Graph}, as enumerations
 * (in contrast to plain strings) must not be quoted. This class should never be
 * instantiated manually, but instead is used internally by the
 * {@link enumerate} function.
 *
 * @see {@link enumerate}
 */
export abstract class Enum extends String {

  /**
   * Private abstract constructor (which should never be called).
   *
   * @throws TypeError.
   */
  // @ts-expect-error missing super call
  private constructor() {
    throw new TypeError();
  }

}

/**
 * Enumeration helper function. Enumerations are special objects and all used
 * [TypeScript enum](https://www.typescriptlang.org/docs/handbook/enums.html)s
 * have to be looped through this helper function before they can be utilized in
 * conjunction with the {@link Model}.
 *
 * @param enumerator - TypeScript enumeration.
 * @typeParam T - TypeScript enumeration type.
 * @returns Processed enumeration.
 *
 * @example Enumerate an enum.
 * ```ts
 * import { enumerate } from '@sgrud/data';
 *
 * enum Enumeration {
 *   One = 'ONE',
 *   Two = 'TWO'
 * }
 *
 * export type ExampleEnum = Enumeration;
 * export const ExampleEnum = enumerate(Enumeration);
 * ```
 *
 * @see {@link Model}
 */
export function enumerate<T extends object>(enumerator: T): T {
  const enumeration = { } as Record<string, Enum>;

  for (const key in enumerator) {
    const value = new String(enumerator[key]);
    Object.setPrototypeOf(value, Enum.prototype);
    enumeration[key] = value;
  }

  return enumeration as T;
}
