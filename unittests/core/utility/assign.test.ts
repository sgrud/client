import { assign } from '@sgrud/core';

describe('@sgrud/core/utility/assign', () => {

  /*
   * Variables
   */

  const values = [
    { 0: { 1: { 0: 1 } }, 1: 1 },
    { 0: { 2: { 0: 2 } }, 2: 2 },
    { 0: { 3: { 0: 3 } }, 3: 3 }
  ];

  /*
   * Unittests
   */

  describe.each(values)('assigning source %O', (source) => {
    describe.each(values)('to target %O', (target) => {
      if (values.indexOf(source) !== values.indexOf(target)) {
        const object = {};
        const result = assign(object, { ...target }, { ...source });

        it('mutates the target', () => {
          expect(object).toBe(result);
        });

        it('deep copies the source to the target', () => {
          expect(result).toMatchObject(source);
          expect(result).toMatchObject(target);
        });
      }
    });
  });

  describe('assigning multiple sources', () => {
    const object = {};
    const result = assign(object, ...values);

    it('mutates the target', () => {
      expect(object).toBe(result);
    });

    it('deep copies all sources to the target', () => {
      for (const value of values) {
        expect(result).toMatchObject(value);
      }
    });
  });

});
