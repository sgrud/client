import { HasMany, Model, Property } from '@sgrud/data';
import { auditTime, take } from 'rxjs';

describe('@sgrud/data/relation/has-many', () => {

  class Parent extends Model<Parent> {
    @HasMany(() => Child) public children?: Child[];
    @Property(() => String) public property?: string;
    @HasMany(() => null!) public undefined?: null[];
    @HasMany(() => null!, false) public unused?: null[];
    protected readonly [Symbol.toStringTag]: string = 'Parent';
  }

  class Child extends Model<Child> {
    @Property(() => String) public property?: string;
    protected readonly [Symbol.toStringTag]: string = 'Child';
  }

  const values = [
    { children: [{ property: 'childOne' }, { property: 'childTwo' }] },
    { property: 'parent' },
    { undefined: undefined },
    { unused: undefined }
  ];

  describe('instantiating a model which has many models using parts', () => {
    const model = new Parent(...values);
    const validate = (value: Parent) => {
      expect(value.property).toBe(values[1].property);
      expect(value.children![0].property).toBe(values[0].children![0].property);
      expect(value.children![1].property).toBe(values[0].children![1].property);
    };

    it('assigns all supplied parts to the model which has many models', () => {
      validate(model);
    });
  });

  describe('assigning parts to a model which has many models', () => {
    const model = new Parent();
    const validate = (value: Parent) => {
      expect(value.property).toBe(values[1].property);
      expect(value.children![0].property).toBe(values[0].children![0].property);
      expect(value.children![1].property).toBe(values[0].children![1].property);
    };

    it('emits the changed model which has many models', (done) => {
      const subscription = model.value.pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);
      model.assign(...values).subscribe(validate);
    });

    it('assigns all supplied parts to the model which has many models', () => {
      validate(model);
    });
  });

  describe('assigning null-parts to a model which has many models', () => {
    const model = new Parent();
    const validate = (value: Parent) => {
      expect(value.property).toBeNull();
      expect(value.children).toBeNull();
    };

    it('emits the changed model which has many models', (done) => {
      const subscription = model.value.pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);

      model.assign(...values.flatMap((value) => {
        return Object.keys(value).map((key) => ({
          [key]: null
        })) as Model.Shape<Parent>;
      })).subscribe(validate);
    });

    it('assigns all null-parts to the model which has many models', () => {
      validate(model);
    });
  });

  describe('clearing a model which has many models', () => {
    const model = new Parent(...values);
    const validate = (value: Parent) => {
      expect(value.property).toBeUndefined();
      expect(value.children).toBeUndefined();
    };

    it('emits the changed model which has many models', (done) => {
      const subscription = model.value.pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);
      model.clear().subscribe(validate);
    });

    it('clears the model which has many models', () => {
      validate(model);
    });
  });

  describe('serializing a model which has many models', () => {
    const model = new Parent(...values);
    const validate = (value: Model.Shape<Parent>) => {
      expect(value.property).toBe(values[1].property);
      expect(value.children![0].property).toBe(values[0].children![0].property);
      expect(value.children![1].property).toBe(values[0].children![1].property);
    };

    it('returns the serialized model which has many models', () => {
      validate(model.serialize()!);
    });
  });

  describe('treemapping a model which has many models', () => {
    const model = new Parent(...values);
    const validate = (value: Model.Graph<Parent>) => {
      expect(value).toStrictEqual([
        'property',
        { children: [
          'property'
        ] }
      ]);
    };

    it('returns the treemapped model which has many models', () => {
      validate(model.treemap()!);
    });
  });

  describe('unraveling a model which has many models', () => {
    const model = new Parent(...values);
    const validate = (value: string) => {
      expect(value).toBe('{property children{property}}');
    };

    it('returns the unraveled model which has many models', () => {
      validate(Parent.unravel(model.treemap()!));
    });
  });

});
