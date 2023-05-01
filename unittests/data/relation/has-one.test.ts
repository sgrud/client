import { HasOne, Model, Property } from '@sgrud/data';
import { auditTime, from, map } from 'rxjs';

describe('@sgrud/data/relation/has-one', () => {

  /*
   * Variables
   */

  class Owned extends Model<Owned> {

    @Property(() => String)
    public property?: string;

    protected readonly [Symbol.toStringTag]: string = 'Owned';

  }

  class Owner extends Model<Owner> {

    @HasOne(() => Owned)
    public owned?: Owned;

    @Property(() => String)
    public property?: string;

    @HasOne(() => null!, true)
    public transient?: unknown;

    @HasOne(() => null!)
    public unknown?: unknown;

    protected readonly [Symbol.toStringTag]: string = 'Owner';

  }

  const values = [
    { owned: { property: 'owned' } },
    { property: 'owner' },
    { transient: undefined },
    { unknown: undefined }
  ];

  /*
   * Unittests
   */

  describe('instantiating a model which has one model using parts', () => {
    const owner = new Owner(...values);

    it('assigns all supplied parts to the model which has one model', () => {
      expect(owner.owned!.property).toBe(values[0].owned!.property);
      expect(owner.property).toBe(values[1].property);
    });
  });

  describe('assigning parts to a model which has one model', () => {
    const owner = new Owner();

    it('assigns all parts to the model which has one model', (done) => {
      const changes = from(owner).pipe(auditTime(250), map((next) => {
        expect(next.owned!.property).toBe(values[0].owned!.property);
        expect(next.property).toBe(values[1].property);
      })).subscribe({
        error: done
      });

      owner.assign(...values).pipe(map((next) => {
        changes.unsubscribe();
        expect(next).toBe(owner);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('assigning null-parts to a model which has one model', () => {
    const owner = new Owner();

    it('assigns all null-parts to the model which has one model', (done) => {
      const changes = from(owner).pipe(auditTime(250), map((next) => {
        expect(next.owned).toBeNull();
        expect(next.property).toBeNull();
      })).subscribe({
        error: done
      });

      owner.assign(...values.flatMap((value) => {
        return Object.keys(value).map((key) => ({ [key]: null }));
      })).pipe(map((next) => {
        changes.unsubscribe();
        expect(next).toBe(owner);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('clearing a model which has one model', () => {
    const owner = new Owner(...values);

    it('clears the model which has one model', (done) => {
      const changes = from(owner).pipe(auditTime(250), map((next) => {
        expect(next.owned).toBeUndefined();
        expect(next.property).toBeUndefined();
      })).subscribe({
        error: done
      });

      owner.clear().pipe(map((next) => {
        changes.unsubscribe();
        expect(next).toBe(owner);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('serializing a model which has one model', () => {
    const result = new Owner(...values).serialize()!;

    it('returns the serialized model which has one model', () => {
      expect(result.owned!.property).toBe(values[0].owned!.property);
      expect(result.property).toBe(values[1].property);
    });
  });

  describe('serializing a model which has null-parts', () => {
    const result = new Owner(...values.flatMap((value) => {
      return Object.keys(value).map((key) => ({ [key]: null }));
    })).serialize()!;

    it('returns the serialized model which has null-parts', () => {
      expect(result.owned).toBeNull();
      expect(result.property).toBeNull();
    });
  });

  describe('treemapping a model which has one model', () => {
    const result = new Owner(...values).treemap();

    it('returns the treemapped model which has one model', () => {
      expect(result).toStrictEqual([
        'property',
        { owned: [
          'property'
        ] }
      ]);
    });
  });

  describe('unraveling a model which has one model', () => {
    const result = Owner.unravel(new Owner(...values).treemap()!);

    it('returns the unraveled model which has one model', () => {
      expect(result).toBe('{property owned{property}}');
    });
  });

});
