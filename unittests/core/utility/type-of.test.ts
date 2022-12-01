import { TypeOf } from '@sgrud/core';

describe('@sgrud/core/utility/type-of', () => {

  const methods = [
    TypeOf.array.bind(TypeOf),
    TypeOf.boolean.bind(TypeOf),
    TypeOf.date.bind(TypeOf),
    TypeOf.function.bind(TypeOf),
    TypeOf.global.bind(TypeOf),
    TypeOf.null.bind(TypeOf),
    TypeOf.number.bind(TypeOf),
    TypeOf.object.bind(TypeOf),
    TypeOf.process.bind(TypeOf),
    TypeOf.promise.bind(TypeOf),
    TypeOf.regex.bind(TypeOf),
    TypeOf.string.bind(TypeOf),
    TypeOf.undefined.bind(TypeOf),
    TypeOf.url.bind(TypeOf),
    TypeOf.window.bind(TypeOf)
  ];

  const values = [
    [],
    true,
    new Date(),
    Function.prototype,
    { [Symbol.toStringTag]: 'global' },
    null,
    0,
    { },
    Object.create(process),
    Object.create(Promise.resolve()),
    /-/,
    '',
    undefined,
    new URL('url://'),
    { [Symbol.toStringTag]: 'Window' }
  ];

  describe.each(methods)('applying method %O', (method) => {
    const index = methods.indexOf(method);

    describe.each(values)('to value %O', (value) => {
      if (index === values.indexOf(value)) {
        it('returns true', () => {
          expect(method(value)).toBe(true);
        });
      } else {
        it('returns false', () => {
          expect(method(value)).toBe(false);
        });
      }
    });
  });

  describe('calling the abstract constructor', () => {
    const construct = () => new (TypeOf as any)();

    it('throws an error', () => {
      expect(construct).toThrowError(TypeError);
    });
  });

});
