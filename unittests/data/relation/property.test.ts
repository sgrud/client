import { Model, Property } from '@sgrud/data';
import { auditTime, take } from 'rxjs';

describe('@sgrud/data/relation/property', () => {

  class Class extends Model<Class> {
    @Property(() => Boolean) public bool?: boolean;
    @Property(() => Date) public date?: Date;
    @Property(() => Number) public num?: number;
    @Property(() => String) public str?: string;
    @Property(() => null!) public undefined?: null;
    @Property(() => null!, false) public unused?: null;
    protected readonly [Symbol.toStringTag]: string = 'Class';
  }

  const values = [
    { bool: true },
    { date: new Date() },
    { num: 0 },
    { str: 'string' },
    { undefined: undefined },
    { unused: undefined }
  ];

  describe('instantiating a model containing properties using parts', () => {
    const model = new Class(...values);
    const validate = (value: Class) => {
      expect(value.bool).toBe(values[0].bool);
      expect(value.date).toBe(values[1].date!.valueOf());
      expect(value.num).toBe(values[2].num);
      expect(value.str).toBe(values[3].str);
    };

    it('assigns all supplied parts to the model containing properties', () => {
      validate(model);
    });
  });

  describe('assigning parts to a model containing properties', () => {
    const model = new Class();
    const validate = (value: Class) => {
      expect(value.bool).toBe(values[0].bool);
      expect(value.date).toBe(values[1].date!.valueOf());
      expect(value.num).toBe(values[2].num);
      expect(value.str).toBe(values[3].str);
    };

    it('emits the changed model containing properties', (done) => {
      const subscription = model.value.pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);
      model.assign(...values).subscribe(validate);
    });

    it('assigns all supplied parts to the model containing properties', () => {
      validate(model);
    });
  });

  describe('assigning null-parts to a model containing properties', () => {
    const model = new Class();
    const validate = (value: Class) => {
      expect(value.bool).toBeNull();
      expect(value.date).toBeNull();
      expect(value.num).toBeNull();
      expect(value.str).toBeNull();
    };

    it('emits the changed model containing properties', (done) => {
      const subscription = model.value.pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);

      model.assign(...values.flatMap((value) => {
        return Object.keys(value).map((key) => ({
          [key]: null
        })) as Model.Shape<Class>;
      })).subscribe(validate);
    });

    it('assigns all null-parts to the model containing properties', () => {
      validate(model);
    });
  });

  describe('clearing a model containing properties', () => {
    const model = new Class(...values);
    const validate = (value: Class) => {
      expect(value.bool).toBeUndefined();
      expect(value.date).toBeUndefined();
      expect(value.num).toBeUndefined();
      expect(value.str).toBeUndefined();
    };

    it('emits the changed model containing properties', (done) => {
      const subscription = model.value.pipe(
        auditTime(250),
        take(1)
      ).subscribe(validate);

      subscription.add(done);
      model.clear().subscribe(validate);
    });

    it('clears the model containing properties', () => {
      validate(model);
    });
  });

  describe('serializing a model containing properties', () => {
    const model = new Class(...values);
    const validate = (value: Model.Shape<Class>) => {
      expect(value.bool).toBe(values[0].bool);
      expect(value.date).toContain('+');
      expect(value.num).toBe(values[2].num);
      expect(value.str).toBe(values[3].str);
    };

    it('returns the serialized model containing properties', () => {
      validate(model.serialize()!);
    });
  });

  describe('treemapping a model containing properties', () => {
    const model = new Class(...values);
    const validate = (value: Model.Graph<Class>) => {
      expect(value).toStrictEqual([
        'bool',
        'date',
        'num',
        'str'
      ]);
    };

    it('returns the treemapped model containing properties', () => {
      validate(model.treemap()!);
    });
  });

  describe('unraveling a model containing properties', () => {
    const model = new Class(...values);
    const validate = (value: string) => {
      expect(value).toBe('{bool date num str}');
    };

    it('returns the unraveled model containing properties', () => {
      validate(Class.unravel(model.treemap()!));
    });
  });

});
