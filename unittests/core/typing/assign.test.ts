import { assign } from '@sgrud/core';

describe('@sgrud/core/typing/assign', () => {

  const values = Object.freeze([
    Object.freeze({ 0: Object.freeze({ 1: Object.freeze({ 0: 1 }) }), 1: 1 }),
    Object.freeze({ 0: Object.freeze({ 2: Object.freeze({ 0: 2 }) }), 2: 2 }),
    Object.freeze({ 0: Object.freeze({ 3: Object.freeze({ 0: 3 }) }), 3: 3 })
  ]);

  describe.each(values)('assigning source %O', (source) => {
    describe.each(values)('to target %O', (target) => {
      if (values.indexOf(source) !== values.indexOf(target)) {
        const mutate = { };
        const result = assign(mutate, { ...target }, { ...source });

        it('mutates the target', () => {
          expect(mutate).toBe(result);
        });

        it('deep copies the source to the target', () => {
          expect(result).toMatchObject(source);
          expect(result).toMatchObject(target);
        });
      }
    });
  });

  describe('assigning multiple sources', () => {
    const mutate = { };
    const result = assign(mutate, ...values);

    it('mutates the target', () => {
      expect(mutate).toBe(result);
    });

    it('deep copies all sources to the target', () => {
      for (const value of values) {
        expect(result).toMatchObject(value);
      }
    });
  });

});
