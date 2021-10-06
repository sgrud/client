import { assign } from '@sgrud/utils';

describe('@sgrud/utils/typing/assign', () => {

  const values = [
    { 1: 1, deep: { 1: true } },
    { 2: 2, deep: { 2: true } },
    { 3: 3, deep: { 3: true } }
  ];

  describe.each(values)('assigning source %O', (source) => {
    describe.each(values)('to target %O', (target) => {
      const result = assign(target, source);

      if (source !== target) {
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
