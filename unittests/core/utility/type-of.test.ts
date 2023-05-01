/* eslint-disable @typescript-eslint/unbound-method */

import { TypeOf } from '@sgrud/core';

describe('@sgrud/core/utility/type-of', () => {

  /*
   * Variables
   */

  const methods = [
    TypeOf.array,
    TypeOf.boolean,
    TypeOf.date,
    TypeOf.function,
    TypeOf.null,
    TypeOf.number,
    TypeOf.object,
    TypeOf.process,
    TypeOf.promise,
    TypeOf.regex,
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
    null,
    0,
    {},
    Object.create(process),
    Object.create(Promise.prototype),
    /./,
    '',
    undefined,
    Object.create(URL.prototype),
    Object.create(Window.prototype)
  ];

  /*
   * Unittests
   */

  describe('calling the abstract constructor', () => {
    const construct = () => new (TypeOf as any)();

    it('throws an error', () => {
      expect(construct).toThrowError(TypeError);
    });
  });

  describe.each(methods)('applying method %O', (method) => {
    describe.each(values)('to value %O', (value) => {
      if (methods.indexOf(method) === values.indexOf(value)) {
        it('returns true', () => {
          expect(method.call(TypeOf, value)).toBeTruthy();
        });
      } else {
        it('returns false', () => {
          expect(method.call(TypeOf, value)).toBeFalsy();
        });
      }
    });
  });

});
