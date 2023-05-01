import { Model, Property } from '@sgrud/data';
import { auditTime, from, map } from 'rxjs';

describe('@sgrud/data/relation/property', () => {

  /*
   * Variables
   */

  class Class extends Model<Class> {

    @Property(() => Boolean)
    public boolean?: boolean;

    @Property(() => Date)
    public date?: Date;

    @Property(() => Number)
    public number?: number;

    @Property(() => String)
    public string?: string;

    @Property(() => null!, true)
    public transient?: unknown;

    @Property(() => null!)
    public unknown?: unknown;

    protected readonly [Symbol.toStringTag]: string = 'Class';

  }

  const values = [
    { boolean: true },
    { date: new Date() },
    { number: 0 },
    { string: 'string' },
    { transient: undefined },
    { unknown: undefined }
  ];

  /*
   * Unittests
   */

  describe('instantiating a model containing properties using parts', () => {
    const model = new Class(...values);

    it('assigns all supplied parts to the model containing properties', () => {
      expect(model.boolean).toBe(values[0].boolean);
      expect(model.date).toBe(values[1].date!.valueOf());
      expect(model.number).toBe(values[2].number);
      expect(model.string).toBe(values[3].string);
    });
  });

  describe('assigning parts to a model containing properties', () => {
    const model = new Class();

    it('assigns all parts to the model containing properties', (done) => {
      const changes = from(model).pipe(auditTime(250), map((next) => {
        expect(next.boolean).toBe(values[0].boolean);
        expect(next.date).toBe(values[1].date!.valueOf());
        expect(next.number).toBe(values[2].number);
        expect(next.string).toBe(values[3].string);
      })).subscribe({
        error: done
      });

      model.assign(...values).pipe(map((next) => {
        changes.unsubscribe();
        expect(next).toBe(model);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('assigning null-parts to a model containing properties', () => {
    const model = new Class();

    it('assigns all null-parts to the model containing properties', (done) => {
      const changes = from(model).pipe(auditTime(250), map((next) => {
        expect(next.boolean).toBeNull();
        expect(next.date).toBeNull();
        expect(next.number).toBeNull();
        expect(next.string).toBeNull();
      })).subscribe({
        error: done
      });

      model.assign(...values.flatMap((value) => {
        return Object.keys(value).map((key) => ({ [key]: null }));
      })).pipe(map((next) => {
        changes.unsubscribe();
        expect(next).toBe(model);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('clearing a model containing properties', () => {
    const model = new Class(...values);

    it('clears the model containing properties', (done) => {
      const changes = from(model).pipe(auditTime(250), map((next) => {
        expect(next.boolean).toBeUndefined();
        expect(next.date).toBeUndefined();
        expect(next.number).toBeUndefined();
        expect(next.string).toBeUndefined();
      })).subscribe({
        error: done
      });

      model.clear().pipe(map((next) => {
        changes.unsubscribe();
        expect(next).toBe(model);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('serializing a model containing properties', () => {
    const result = new Class(...values).serialize()!;

    it('returns the serialized model containing properties', () => {
      expect(result.boolean).toBe(values[0].boolean);
      expect(result.date).toContain('+');
      expect(result.number).toBe(values[2].number);
      expect(result.string).toBe(values[3].string);
    });
  });

  describe('serializing a model which has null-parts', () => {
    const result = new Class(...values.flatMap((value) => {
      return Object.keys(value).map((key) => ({ [key]: null }));
    })).serialize()!;

    it('returns the serialized model which has null-parts', () => {
      expect(result.boolean).toBeNull();
      expect(result.date).toBeNull();
      expect(result.number).toBeNull();
      expect(result.string).toBeNull();
    });
  });

  describe('treemapping a model containing properties', () => {
    const result = new Class(...values).treemap()!;

    it('returns the treemapped model containing properties', () => {
      expect(result).toStrictEqual([
        'boolean',
        'date',
        'number',
        'string'
      ]);
    });
  });

  describe('unraveling a model containing properties', () => {
    const result = Class.unravel(new Class(...values).treemap()!);

    it('returns the unraveled model containing properties', () => {
      expect(result).toBe('{boolean date number string}');
    });
  });

});
