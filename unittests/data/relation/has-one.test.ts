import { Symbol } from '@sgrud/core';
import { HasOne, Model, Property } from '@sgrud/data';
import { auditTime, first, from } from 'rxjs';

describe('@sgrud/data/relation/has-one', () => {

  const values = [
    { owned: { property: 'owned' } },
    { property: 'owner' },
    { unset: undefined },
    { unused: undefined }
  ];

  class Owner extends Model<Owner> {
    @HasOne(() => Owned) public owned?: Owned;
    @Property(() => String) public property?: string;
    @HasOne(() => null!) public unset?: null;
    @HasOne(() => null!, true) public unused?: null;
    protected readonly [Symbol.toStringTag]: string = 'Owner';
  }

  class Owned extends Model<Owned> {
    @Property(() => String) public property?: string;
    protected readonly [Symbol.toStringTag]: string = 'Owned';
  }

  describe('instantiating a model which has one model using parts', () => {
    const owner = new Owner(...values);
    const validate = (value: Owner) => {
      expect(value.property).toBe(values[1].property);
      expect(value.owned!.property).toBe(values[0].owned!.property);
    };

    it('assigns all supplied parts to the model which has one model', () => {
      validate(owner);
    });
  });

  describe('assigning parts to a model which has one model', () => {
    const owner = new Owner();
    const validate = (value: Owner) => {
      expect(value.property).toBe(values[1].property);
      expect(value.owned!.property).toBe(values[0].owned!.property);
    };

    it('emits the changed model which has one model', (done) => {
      const subscription = from(owner).pipe(
        auditTime(250),
        first()
      ).subscribe(validate);

      subscription.add(done);
      owner.assign(...values).subscribe(validate);
    });

    it('assigns all supplied parts to the model which has one model', () => {
      validate(owner);
    });
  });

  describe('assigning null-parts to a model which has one model', () => {
    const owner = new Owner();
    const validate = (value: Owner) => {
      expect(value.property).toBeNull();
      expect(value.owned).toBeNull();
    };

    it('emits the changed model which has one model', (done) => {
      const subscription = from(owner).pipe(
        auditTime(250),
        first()
      ).subscribe(validate);

      subscription.add(done);

      owner.assign(...values.flatMap((value) => {
        return Object.keys(value).map((key) => ({
          [key]: null
        }));
      })).subscribe(validate);
    });

    it('assigns all null-parts to the model which has one model', () => {
      validate(owner);
    });
  });

  describe('clearing a model which has one model', () => {
    const owner = new Owner(...values);
    const validate = (value: Owner) => {
      expect(value.property).toBeUndefined();
      expect(value.owned).toBeUndefined();
    };

    it('emits the changed model which has one model', (done) => {
      const subscription = from(owner).pipe(
        auditTime(250),
        first()
      ).subscribe(validate);

      subscription.add(done);
      owner.clear().subscribe(validate);
    });

    it('clears the model which has one model', () => {
      validate(owner);
    });
  });

  describe('serializing a model which has one model', () => {
    const owner = new Owner(...values);
    const validate = (value: Model.Shape<Owner>) => {
      expect(value.property).toBe(values[1].property);
      expect(value.owned!.property).toBe(values[0].owned!.property);
    };

    it('returns the serialized model which has one model', () => {
      validate(owner.serialize()!);
    });
  });

  describe('serializing a model which has null-parts', () => {
    const owner = new Owner(...values.flatMap((value) => {
      return Object.keys(value).map((key) => ({ [key]: null }));
    }));
    const validate = (value: Model.Shape<Owner>) => {
      expect(value.property).toBe(null);
      expect(value.owned).toBe(null);
    };

    it('returns the serialized model which has null-parts', () => {
      validate(owner.serialize()!);
    });
  });

  describe('treemapping a model which has one model', () => {
    const owner = new Owner(...values);
    const validate = (value: Model.Graph<Owner>) => {
      expect(value).toStrictEqual([
        'property',
        { owned: [
          'property'
        ] }
      ]);
    };

    it('returns the treemapped model which has one model', () => {
      validate(owner.treemap()!);
    });
  });

  describe('unraveling a model which has one model', () => {
    const owner = new Owner(...values);
    const validate = (value: string) => {
      expect(value).toBe(
        '{property owned{property}}'
      );
    };

    it('returns the unraveled model which has one model', () => {
      validate(Owner.unravel(owner.treemap()!));
    });
  });

});
