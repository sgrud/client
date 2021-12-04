/* eslint-disable @typescript-eslint/unbound-method */

import { TypeOf } from '@sgrud/core';

describe('@sgrud/core/typing/type-of', () => {

  const methods = [
    TypeOf.array,
    TypeOf.boolean,
    TypeOf.date,
    TypeOf.function,
    TypeOf.global,
    TypeOf.null,
    TypeOf.number,
    TypeOf.object,
    TypeOf.process,
    TypeOf.promise,
    TypeOf.string,
    TypeOf.undefined,
    TypeOf.url,
    TypeOf.window
  ];

  const values = [
    [],
    true,
    new Date(),
    () => undefined,
    { [Symbol.toStringTag]: 'global' },
    null,
    0,
    { },
    Object.create(process),
    Promise.resolve(),
    '',
    undefined,
    { [Symbol.toStringTag]: 'URL' },
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
    it('throws an error', () => {
      expect(() => new (TypeOf as any)()).toThrowError(TypeError);
    });
  });

});
