/**
 * Strict type-assertion and runtime type-checking utility.
 */
export const typeOf: {

  /**
   * Type-check for `Array<any>`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Array<any>`.
   *
   * @example Type-check `null` for `Array<any>`.
   * ```ts
   * typeOf.array(null); // false
   * ```
   */
  array: (value: unknown) => value is Array<any>;

  /**
   * Type-check for `boolean`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `boolean`.
   *
   * @example Type-check `null` for `boolean`.
   * ```ts
   * typeOf.boolean(null); // false
   * ```
   */
  boolean: (value: unknown) => value is boolean;

  /**
   * Type-check for `Date`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Date`.
   *
   * @example Type-check `null` for `Date`.
   * ```ts
   * typeOf.date(null); // false
   * ```
   */
  date: (value: unknown) => value is Date;

  /**
   * Type-check for `Function`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Function`.
   *
   * @example Type-check `null` for `Function`.
   * ```ts
   * typeOf.function(null); // false
   * ```
   */
  function: (value: unknown) => value is Function;

  /**
   * Type-check for `global`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `global`.
   *
   * @example Type-check `null` for `global`.
   * ```ts
   * typeOf.global(null); // false
   * ```
   */
  global: (value: unknown) => value is typeof globalThis;

  /**
   * Type-check for `null`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `null`.
   *
   * @example Type-check `null` for `null`.
   * ```ts
   * typeOf.null(null); // true
   * ```
   */
  null: (value: unknown) => value is null;

  /**
   * Type-check for `number`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `number`.
   *
   * @example Type-check `null` for `number`.
   * ```ts
   * typeOf.number(null); // false
   * ```
   */
  number: (value: unknown) => value is number;

  /**
   * Type-check for `object`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `object`.
   *
   * @example Type-check `null` for `object`.
   * ```ts
   * typeOf.object(null); // false
   * ```
   */
  object: (value: unknown) => value is object;

  /**
   * Type-check for `NodeJS.Process`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `NodeJS.Process`.
   *
   * @example Type-check `null` for `NodeJS.Process`.
   * ```ts
   * typeOf.process(null); // false
   * ```
   */
  process: (value: unknown) => value is NodeJS.Process;

  /**
   * Type-check for `Promise<any>`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Promise<any>`.
   *
   * @example Type-check `null` for `Promise<any>`.
   * ```ts
   * typeOf.promise(null); // false
   * ```
   */
  promise: (value: unknown) => value is Promise<any>;

  /**
   * Type-check for `string`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `string`.
   *
   * @example Type-check `null` for `string`.
   * ```ts
   * typeOf.string(null); // false
   * ```
   */
  string: (value: unknown) => value is string;

  /**
   * Type-check for `undefined`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `undefined`.
   *
   * @example Type-check `null` for `undefined`.
   * ```ts
   * typeOf.undefined(null); // false
   * ```
   */
  undefined: (value: unknown) => value is undefined;

  /**
   * Type-check for `Window`.
   *
   * @param value - Value to type-check.
   * @returns Whether `value` is of type `Window`.
   *
   * @example Type-check `null` for `Window`.
   * ```ts
   * typeOf.window(null); // false
   * ```
   */
  window: (value: unknown) => value is Window;

} = {
  array: (value: unknown): value is Array<any> => test('Array', value),
  boolean: (value: unknown): value is boolean => test('Boolean', value),
  date: (value: unknown): value is Date => test('Date', value),
  function: (value: unknown): value is Function => test('Function', value),
  global: (value: unknown): value is typeof globalThis => test('global', value),
  null: (value: unknown): value is null => test('Null', value),
  number: (value: unknown): value is number => test('Number', value),
  object: (value: unknown): value is object => test('Object', value),
  process: (value: unknown): value is NodeJS.Process => test('process', value),
  promise: (value: unknown): value is Promise<any> => test('Promise', value),
  string: (value: unknown): value is string => test('String', value),
  undefined: (value: unknown): value is undefined => test('Undefined', value),
  window: (value: unknown): value is Window => test('Window', value)
};

/**
 * Type-check `value` for `type`.
 *
 * @internal
 * @param type - Type to check.
 * @param value - Value to check.
 * @returns Whether `value` is `type`.
 */
function test(type: string, value: unknown): boolean {
  return `[object ${type}]` === Object.prototype.toString.call(value);
}
