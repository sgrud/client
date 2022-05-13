import { HasMany, Model, Property } from '@sgrud/data';
import { auditTime, from, take } from 'rxjs';

describe('@sgrud/data/relation/has-many', () => {

  class Owner extends Model<Owner> {
    @HasMany(() => Owned) public owned?: Owned[];
    @Property(() => String) public property?: string;
    @HasMany(() => null!) public undefined?: null[];
    @HasMany(() => null!, true) public unused?: null[];
    protected readonly [Symbol.toStringTag]: string = 'Owner';
  }

  class Owned extends Model<Owned> {
    @Property(() => String) public property?: string;
    protected readonly [Symbol.toStringTag]: string = 'Owned';
  }

  const values = [
    { owned: [{ property: 'ownedOne' }, { property: 'ownedTwo' }] },
    { property: 'owner' },
    { undefined: undefined },
    { unused: undefined }
  ];

  describe('instantiating a model which has many models using parts', () => {
    const owner = new Owner(...values);
    const validate = (value: Owner) => {
      expect(value.property).toBe(values[1].property);
      expect(value.owned![0].property).toBe(values[0].owned![0].property);
      expect(value.owned![1].property).toBe(values[0].owned![1].property);
    };

    it('assigns all supplied parts to the model which has many models', () => {
      validate(owner);
    });
  });

  describe('assigning parts to a model which has many models', () => {
    const owner = new Owner();
    const validate = (value: Owner) => {
      expect(value.property).toBe(values[1].property);
      expect(value.owned![0].property).toBe(values[0].owned![0].property);
      expect(value.owned![1].property).toBe(values[0].owned![1].property);
    };

    it('emits the changed model which has many models', (done) => {
      const subscription = from(owner).pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);
      owner.assign(...values).subscribe(validate);
    });

    it('assigns all supplied parts to the model which has many models', () => {
      validate(owner);
    });
  });

  describe('assigning null-parts to a model which has many models', () => {
    const owner = new Owner();
    const validate = (value: Owner) => {
      expect(value.property).toBeNull();
      expect(value.owned).toBeNull();
    };

    it('emits the changed model which has many models', (done) => {
      const subscription = from(owner).pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);

      owner.assign(...values.flatMap((value) => {
        return Object.keys(value).map((key) => ({
          [key]: null
        }));
      })).subscribe(validate);
    });

    it('assigns all null-parts to the model which has many models', () => {
      validate(owner);
    });
  });

  describe('clearing a model which has many models', () => {
    const owner = new Owner(...values);
    const validate = (value: Owner) => {
      expect(value.property).toBeUndefined();
      expect(value.owned).toBeUndefined();
    };

    it('emits the changed model which has many models', (done) => {
      const subscription = from(owner).pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);
      owner.clear().subscribe(validate);
    });

    it('clears the model which has many models', () => {
      validate(owner);
    });
  });

  describe('serializing a model which has null-parts', () => {
    const owner = new Owner(...values.flatMap((value) => {
      return Object.keys(value).map((key) => ({
        [key]: null
      }));
    }));
    const validate = (value: Model.Shape<Owner>) => {
      expect(value.property).toBeNull();
      expect(value.owned).toBeNull();
    };

    it('returns the serialized model which has null-parts', () => {
      validate(owner.serialize()!);
    });
  });

  describe('serializing a model which has many models', () => {
    const owner = new Owner(...values);
    const validate = (value: Model.Shape<Owner>) => {
      expect(value.property).toBe(values[1].property);
      expect(value.owned![0].property).toBe(values[0].owned![0].property);
      expect(value.owned![1].property).toBe(values[0].owned![1].property);
    };

    it('returns the serialized model which has many models', () => {
      validate(owner.serialize()!);
    });
  });

  describe('treemapping a model which has many models', () => {
    const owner = new Owner(...values);
    const validate = (value: Model.Graph<Owner>) => {
      expect(value).toStrictEqual([
        'property',
        { owned: [
          'property'
        ] }
      ]);
    };

    it('returns the treemapped model which has many models', () => {
      validate(owner.treemap()!);
    });
  });

  describe('unraveling a model which has many models', () => {
    const owner = new Owner(...values);
    const validate = (value: string) => {
      expect(value).toBe(
        '{property owned{property}}'
      );
    };

    it('returns the unraveled model which has many models', () => {
      validate(Owner.unravel(owner.treemap()!));
    });
  });

});
