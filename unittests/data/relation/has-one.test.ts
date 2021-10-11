import { HasOne, Model, Property } from '@sgrud/data';
import { auditTime, take } from 'rxjs';

describe('@sgrud/data/relation/has-one', () => {

  class Parent extends Model<Parent> {
    @HasOne(() => Child) public child?: Child;
    @Property(() => String) public property?: string;
    @HasOne(() => null!) public undefined?: null;
    @HasOne(() => null!, false) public unused?: null;
    protected readonly [Symbol.toStringTag]: string = 'Parent';
  }

  class Child extends Model<Child> {
    @Property(() => String) public property?: string;
    protected readonly [Symbol.toStringTag]: string = 'Child';
  }

  const values = [
    { child: { property: 'child' } },
    { property: 'parent' },
    { undefined: undefined },
    { unused: undefined }
  ];

  describe('instantiating a model which has one model using parts', () => {
    const model = new Parent(...values);
    const validate = (value: Parent) => {
      expect(value.property).toBe(values[1].property);
      expect(value.child!.property).toBe(values[0].child!.property);
    };

    it('assigns all supplied parts to the model which has one model', () => {
      validate(model);
    });
  });

  describe('assigning parts to a model which has one model', () => {
    const model = new Parent();
    const validate = (value: Parent) => {
      expect(value.property).toBe(values[1].property);
      expect(value.child!.property).toBe(values[0].child!.property);
    };

    it('emits the changed model which has one model', (done) => {
      const subscription = model.value.pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);
      model.assign(...values).subscribe(validate);
    });

    it('assigns all supplied parts to the model which has one model', () => {
      validate(model);
    });
  });

  describe('assigning null-parts to a model which has one model', () => {
    const model = new Parent();
    const validate = (value: Parent) => {
      expect(value.property).toBeNull();
      expect(value.child).toBeNull();
    };

    it('emits the changed model which has one model', (done) => {
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

    it('assigns all null-parts to the model which has one model', () => {
      validate(model);
    });
  });

  describe('clearing a model which has one model', () => {
    const model = new Parent(...values);
    const validate = (value: Parent) => {
      expect(value.property).toBeUndefined();
      expect(value.child).toBeUndefined();
    };

    it('emits the changed model which has one model', (done) => {
      const subscription = model.value.pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);
      model.clear().subscribe(validate);
    });

    it('clears the model which has one model', () => {
      validate(model);
    });
  });

  describe('serializing a model which has one model', () => {
    const model = new Parent(...values);
    const validate = (value: Model.Shape<Parent>) => {
      expect(value.property).toBe(values[1].property);
      expect(value.child!.property).toBe(values[0].child!.property);
    };

    it('returns the serialized model which has one model', () => {
      validate(model.serialize()!);
    });
  });

  describe('treemapping a model which has one model', () => {
    const model = new Parent(...values);
    const validate = (value: Model.Graph<Parent>) => {
      expect(value).toStrictEqual([
        'property',
        { child: [
          'property'
        ] }
      ]);
    };

    it('returns the treemapped model which has one model', () => {
      validate(model.treemap()!);
    });
  });

  describe('unraveling a model which has one model', () => {
    const model = new Parent(...values);
    const validate = (value: string) => {
      expect(value).toBe('{property child{property}}');
    };

    it('returns the unraveled model which has one model', () => {
      validate(Parent.unravel(model.treemap()!));
    });
  });

});
