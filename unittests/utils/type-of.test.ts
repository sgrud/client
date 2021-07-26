import { typeOf } from '@sgrud/utils';

const methods = [
  typeOf.array,
  typeOf.boolean,
  typeOf.date,
  typeOf.function,
  typeOf.null,
  typeOf.number,
  typeOf.object,
  typeOf.process,
  typeOf.promise,
  typeOf.string,
  typeOf.undefined,
  typeOf.window
];

const values = [
  [],
  true,
  new Date(),
  () => void 0,
  null,
  0,
  { },
  process,
  Promise.resolve(),
  '',
  undefined,
  { [Symbol.toStringTag]: 'Window' }
];

describe('@sgrud/utils/typeOf', () => {

  describe.each(methods)('applying method %O', (method) => {
    describe.each(values)('to value %O', (value) => {
      if (methods.indexOf(method) === values.indexOf(value)) {
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

});
