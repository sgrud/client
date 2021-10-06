/**
 * Strict type-assertion and runtime type-checking utility. When type-checking
 * variables in the global scope, e.g., `window` or `process`, make use of the
 * `globalThis` object.
 *
 * @example Type-check global context.
 * ```ts
 * import { TypeOf } from '@sgrud/utils';
 *
 * TypeOf.process(globalThis.process); // running in node context
 * TypeOf.window(globalThis.window);   // running in browser context
 * ```
 */
export abstract class TypeOf {

  /**
   * Type-check for `Array<any>`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Array<any>`.
   *
   * @example Type-check `null` for `Array<any>`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.array(null); // false
   * ```
   */
  public static array(value: unknown): value is Array<any> {
    return test('Array', value);
  }

  /**
   * Type-check for `boolean`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `boolean`.
   *
   * @example Type-check `null` for `boolean`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.boolean(null); // false
   * ```
   */
  public static boolean(value: unknown): value is boolean {
    return test('Boolean', value);
  }

  /**
   * Type-check for `Date`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Date`.
   *
   * @example Type-check `null` for `Date`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.date(null); // false
   * ```
   */
  public static date(value: unknown): value is Date {
    return test('Date', value);
  }

  /**
   * Type-check for `Function`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Function`.
   *
   * @example Type-check `null` for `Function`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.function(null); // false
   * ```
   */
  public static function(value: unknown): value is Function {
    return test('Function', value);
  }

  /**
   * Type-check for `global`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `typeof globalThis`.
   *
   * @example Type-check `null` for `typeof globalThis`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.global(null); // false
   * ```
   */
  public static global(value: unknown): value is typeof globalThis {
    return test('global', value);
  }

  /**
   * Type-check for `null`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `null`.
   *
   * @example Type-check `null` for `null`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.null(null); // true
   * ```
   */
  public static null(value: unknown): value is null {
    return test('Null', value);
  }

  /**
   * Type-check for `number`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `number`.
   *
   * @example Type-check `null` for `number`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.number(null); // false
   * ```
   */
  public static number(value: unknown): value is number {
    return test('Number', value);
  }

  /**
   * Type-check for `object`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `object`.
   *
   * @example Type-check `null` for `object`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.object(null); // false
   * ```
   */
  public static object(value: unknown): value is object {
    return test('Object', value);
  }

  /**
   * Type-check for `NodeJS.Process`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `NodeJS.Process`.
   *
   * @example Type-check `null` for `NodeJS.Process`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.process(null); // false
   * ```
   */
  public static process(value: unknown): value is NodeJS.Process {
    return test('process', value);
  }

  /**
   * Type-check for `Promise<any>`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Promise<any>`.
   *
   * @example Type-check `null` for `Promise<any>`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.promise(null); // false
   * ```
   */
  public static promise(value: unknown): value is Promise<any> {
    return test('Promise', value);
  }

  /**
   * Type-check for `string`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `string`.
   *
   * @example Type-check `null` for `string`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.string(null); // false
   * ```
   */
  public static string(value: unknown): value is string {
    return test('String', value);
  }

  /**
   * Type-check for `undefined`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `undefined`.
   *
   * @example Type-check `null` for `undefined`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.undefined(null); // false
   * ```
   */
  public static undefined(value: unknown): value is undefined {
    return test('Undefined', value);
  }

  /**
   * Type-check for `URL`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `URL`.
   *
   * @example Type-check `null` for `URL`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.url(null); // false
   * ```
   */
  public static url(value: unknown): value is URL {
    return test('URL', value);
  }

  /**
   * Type-check for `Window`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Window`.
   *
   * @example Type-check `null` for `Window`.
   * ```ts
   * import { TypeOf } from '@sgrud/utils';
   *
   * TypeOf.window(null); // false
   * ```
   */
  public static window(value: unknown): value is Window {
    return test('Window', value);
  }

  /**
   * @internal
   */
  private constructor() {
    throw new TypeError();
  }

}

/**
 * Type-check `value` for `type`.
 *
 * @param type - Type to check.
 * @param value - Value to check.
 * @returns Whether `value` is `type`.
 */
function test(type: string, value: unknown): boolean {
  return `[object ${type}]` === Object.prototype.toString.call(value);
}
