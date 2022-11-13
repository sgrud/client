/**
 * Abstract **Enum** helper class. This class is used by the [Model][] to detect
 * enumerations within a [Graph][], as enumerations (in contrast to plain
 * strings) must not be quoted. This class should never be instantiated
 * manually, but instead is used internally by the [enumerate][] function.
 *
 * [enumerate]: https://sgrud.github.io/client/functions/data.enumerate
 * [Graph]: https://sgrud.github.io/client/types/data.Model-1.Graph
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 *
 * @see [enumerate][]
 */
export abstract class Enum extends String {

  /**
   * Private **constructor** (which should never be called).
   *
   * @throws TypeError.
   */
  // @ts-expect-error missing super call
  private constructor() {
    throw new TypeError();
  }

}

/**
 * **Enumerate** helper function. Enumerations are special objects and all used
 * TypeScript [enums][] have to be looped through this helper function before
 * they can be utilized in conjunction with the [Model][].
 *
 * [enums]: https://www.typescriptlang.org/docs/handbook/enums.html
 * [Model]: https://sgrud.github.io/client/classes/data.Model
 *
 * @param enumerator - TypeScript enumeration.
 * @typeParam T - Enumeration type.
 * @returns Processed enumeration.
 *
 * @example
 * **Enumerate** a TypeScript enumeration:
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
 * @see [Model][]
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
