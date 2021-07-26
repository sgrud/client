function test(type: string, value: unknown): boolean {
  return `[object ${type}]` === Object.prototype.toString.call(value);
}

export const typeOf: {
  array: (value: unknown) => value is any[];
  boolean: (value: unknown) => value is boolean;
  date: (value: unknown) => value is Date;
  function: (value: unknown) => value is Function;
  null: (value: unknown) => value is null;
  number: (value: unknown) => value is number;
  object: (value: unknown) => value is object;
  process: (value: unknown) => value is NodeJS.Process;
  promise: (value: unknown) => value is Promise<any>;
  string: (value: unknown) => value is string;
  undefined: (value: unknown) => value is undefined;
  window: (value: unknown) => value is Window;
} = {
  array: (value: unknown): value is any[] => test('Array', value),
  boolean: (value: unknown): value is boolean => test('Boolean', value),
  date: (value: unknown): value is Date => test('Date', value),
  function: (value: unknown): value is Function => test('Function', value),
  null: (value: unknown): value is null => test('Null', value),
  number: (value: unknown): value is number => test('Number', value),
  object: (value: unknown): value is object => test('Object', value),
  process: (value: unknown): value is NodeJS.Process => test('process', value),
  promise: (value: unknown): value is Promise<any> => test('Promise', value),
  string: (value: unknown): value is string => test('String', value),
  undefined: (value: unknown): value is undefined => test('Undefined', value),
  window: (value: unknown): value is Window => test('Window', value)
};
