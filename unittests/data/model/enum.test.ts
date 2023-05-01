import { Enum, enumerate, Model } from '@sgrud/data';

describe('@sgrud/data/model/enum', () => {

  /*
   * Variables
   */

  class Class extends Model<Class> {

    protected readonly [Symbol.toStringTag]: string = 'Class';

  }

  enum Enumeration {
    One = 'ONE',
    Two = 'TWO'
  }

  /*
   * Unittests
   */

  describe('calling the abstract constructor', () => {
    const construct = () => new (Enum as any)();

    it('throws an error', () => {
      expect(construct).toThrowError(TypeError);
    });
  });

  describe('enumerating an enum type', () => {
    type Enumerated = Enumeration;
    const Enumerated = enumerate(Enumeration);

    it('functions as drop-in replacement for the enum type', () => {
      expect(Enumerated.One.valueOf()).toBe(Enumeration.One);
      expect(Enumerated.Two.valueOf()).toBe(Enumeration.Two);

      for (const key in Enumerated) {
        expect(Enumerated).toHaveProperty(key);
        const value = Enumerated[key as keyof typeof Enumerated];

        switch (value) {
          case Enumerated.One:
            expect(value.valueOf()).toBe(Enumeration.One);
            break;

          case Enumerated.Two:
            expect(value.valueOf()).toBe(Enumeration.Two);
            break;
        }
      }
    });

    it('produces a strict equal object representation', () => {
      const source = JSON.stringify(Enumeration);
      const target = JSON.stringify(Enumerated);
      expect(source).toStrictEqual(target);
    });

    it('mutates the enum value prototype chain', () => {
      expect(Enumerated.One).toBeInstanceOf(Enum);
      expect(Enumerated.Two).toBeInstanceOf(Enum);
    });
  });

  describe('statically unraveling a graph containing an enum', () => {
    type Enumerated = Enumeration;
    const Enumerated = enumerate(Enumeration);
    const result = Class.unravel([
      'uuid',
      { method: () => ({
        one: Enumerated.One,
        two: Enumerated.Two,
        method: [
          'property'
        ]
      }) }
    ] as Model.Graph<Class>);

    it('returns the unraveled graph containing an enum', () => {
      expect(result).toBe('{uuid method(one:ONE two:TWO){property}}');
    });
  });

});
