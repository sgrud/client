/**
 * Strict type-assertion and runtime type-checking utility. When type-checking
 * variables in the global scope, e.g., `window` or `process`, make use of the
 * `globalThis` object.
 *
 * @example
 * Type-check global context:
 * ```ts
 * import { TypeOf } from '@sgrud/core';
 *
 * TypeOf.process(globalThis.process); // true if running in node context
 * TypeOf.window(globalThis.window);   // true if running in browser context
 * ```
 */
export abstract class TypeOf {

  /**
   * Type-check `value` for `unknown[]`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `unknown[]`.
   *
   * @example
   * Type-check `null` for `unknown[]`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.array(null); // false
   * ```
   */
  public static array(value: unknown): value is unknown[] {
    return this.test('Array', value);
  }

  /**
   * Type-check `value` for `boolean`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `boolean`.
   *
   * @example
   * Type-check `null` for `boolean`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.boolean(null); // false
   * ```
   */
  public static boolean(value: unknown): value is boolean {
    return this.test('Boolean', value);
  }

  /**
   * Type-check `value` for `Date`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `Date`.
   *
   * @example
   * Type-check `null` for `Date`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.date(null); // false
   * ```
   */
  public static date(value: unknown): value is Date {
    return this.test('Date', value);
  }

  /**
   * Type-check `value` for `Function`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `Function`.
   *
   * @example
   * Type-check `null` for `Function`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.function(null); // false
   * ```
   */
  public static function(value: unknown): value is Function {
    return this.test('Function', value);
  }

  /**
   * Type-check `value` for `null`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `null`.
   *
   * @example
   * Type-check `null` for `null`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.null(null); // true
   * ```
   */
  public static null(value: unknown): value is null {
    return this.test('Null', value);
  }

  /**
   * Type-check `value` for `number`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `number`.
   *
   * @example
   * Type-check `null` for `number`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.number(null); // false
   * ```
   */
  public static number(value: unknown): value is number {
    return this.test('Number', value);
  }

  /**
   * Type-check `value` for `object`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `object`.
   *
   * @example
   * Type-check `null` for `object`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.object(null); // false
   * ```
   */
  public static object(value: unknown): value is object {
    return this.test('Object', value);
  }

  /**
   * Type-check `value` for `NodeJS.Process`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `NodeJS.Process`.
   *
   * @example
   * Type-check `null` for `NodeJS.Process`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.process(null); // false
   * ```
   */
  public static process(value: unknown): value is NodeJS.Process {
    return this.test('process', value);
  }

  /**
   * Type-check `value` for `Promise<unknown>`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `Promise<unknown>`.
   *
   * @example
   * Type-check `null` for `Promise<unknown>`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.promise(null); // false
   * ```
   */
  public static promise(value: unknown): value is Promise<unknown> {
    return this.test('Promise', value);
  }

  /**
   * Type-check `value` for `RegExp`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `RegExp`.
   *
   * @example
   * Type-check `null` for `RegExp`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.regex(null); // false
   * ```
   */
  public static regex(value: unknown): value is RegExp {
    return this.test('RegExp', value);
  }

  /**
   * Type-check `value` for `string`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `string`.
   *
   * @example
   * Type-check `null` for `string`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.string(null); // false
   * ```
   */
  public static string(value: unknown): value is string {
    return this.test('String', value);
  }

  /**
   * Type-check `value` for `undefined`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `undefined`.
   *
   * @example
   * Type-check `null` for `undefined`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.undefined(null); // false
   * ```
   */
  public static undefined(value: unknown): value is undefined {
    return this.test('Undefined', value);
  }

  /**
   * Type-check `value` for `URL`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `URL`.
   *
   * @example
   * Type-check `null` for `URL`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.url(null); // false
   * ```
   */
  public static url(value: unknown): value is URL {
    return this.test('URL', value);
  }

  /**
   * Type-check `value` for `Window`.
   *
   * @param value - The `value` to type-check.
   * @returns Whether `value` is of type `Window`.
   *
   * @example
   * Type-check `null` for `Window`:
   * ```ts
   * import { TypeOf } from '@sgrud/core';
   *
   * TypeOf.window(null); // false
   * ```
   */
  public static window(value: unknown): value is Window {
    return this.test('Window', value);
  }

  /**
   * Type-check `value` for `type`.
   *
   * @param type - The `type` to check for.
   * @param value - The `value` to type-check.
   * @returns Whether `value` is `type`.
   */
  private static test(type: string, value: unknown): boolean {
    return Object.prototype.toString.call(value) === `[object ${type}]`;
  }

  /**
   * Private **constructor** (which should never be called).
   *
   * @throws A {@link TypeError} upon construction.
   */
  private constructor() {
    throw new TypeError('TypeOf.constructor');
  }

}
