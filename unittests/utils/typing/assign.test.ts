import { assign } from '@sgrud/utils';

describe('@sgrud/utils/typing/assign', () => {

  const values = Object.freeze([
    Object.freeze({ 0: Object.freeze({ 1: Object.freeze({ 0: 1 }) }), 1: 1 }),
    Object.freeze({ 0: Object.freeze({ 2: Object.freeze({ 0: 2 }) }), 2: 2 }),
    Object.freeze({ 0: Object.freeze({ 3: Object.freeze({ 0: 3 }) }), 3: 3 })
  ]);

  describe.each(values)('assigning source %O', (source) => {
    describe.each(values)('to target %O', (target) => {
      if (JSON.stringify(source) !== JSON.stringify(target)) {
        const result = assign({ ...target }, { ...source });

        it('deep copies the source to the target', () => {
          expect(result).toMatchObject(source);
          expect(result).toMatchObject(target);
        });
      }
    });
  });

  describe('assigning multiple sources', () => {
    const result = assign({ }, ...values);

    it('deep copies all sources to the target', () => {
      for (const value of values) {
        expect(result).toMatchObject(value);
      }
    });
  });

});
