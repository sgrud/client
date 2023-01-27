import { Symbol } from '@sgrud/core';
import { Model } from '@sgrud/data';
import { auditTime, catchError, EMPTY, first, from, identity } from 'rxjs';

describe('@sgrud/data/model/model', () => {

  const values = [
    { id: 'id' },
    { created: new Date(0) },
    { modified: new Date() }
  ];

  class Class extends Model<Class> {
    protected readonly [Symbol.toStringTag]: string = 'Class';
  }

  describe('statically committing an operation', () => {
    it('throws an error because no querier is available', (done) => {
      Class.commit('query test').pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('statically calling the deleteAll operation', () => {
    it('throws an error because no querier is available', (done) => {
      Class.deleteAll(['id']).pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('statically calling the deleteOne operation', () => {
    it('throws an error because no querier is available', (done) => {
      Class.deleteOne('id').pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('statically calling the findAll operation', () => {
    it('throws an error because no querier is available', (done) => {
      Class.findAll({ }, []).pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('statically calling the findOne operation', () => {
    it('throws an error because no querier is available', (done) => {
      Class.findOne({ }, []).pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('statically calling the saveAll operation', () => {
    const model = new Class(...values);

    it('throws an error because no querier is available', (done) => {
      Class.saveAll([model], []).pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('statically calling the saveOne operation', () => {
    const model = new Class(...values);

    it('throws an error because no querier is available', (done) => {
      Class.saveOne(model, []).pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('statically serializing a model', () => {
    const model = new Class(...values);

    it('returns the serialized model', () => {
      expect(Class.serialize(model)).toStrictEqual({
        id: values[0].id
      });
    });
  });

  describe('statically serializing a model shallowly', () => {
    const model = new Class(...values);

    it('returns the serialized model', () => {
      expect(Class.serialize(model, true)).toStrictEqual({
        id: values[0].id
      });
    });
  });

  describe('statically treemapping a model', () => {
    const model = new Class(...values);

    it('returns the treemapped model', () => {
      expect(Class.treemap(model)).toStrictEqual(['id']);
    });
  });

  describe('statically treemapping a model shallowly', () => {
    const model = new Class(...values);

    it('returns the treemapped model', () => {
      expect(Class.treemap(model, true)).toStrictEqual(['id']);
    });
  });

  describe('statically unraveling a graph', () => {
    const graph = [
      undefined,
      'id',
      { sub: [
        'id'
      ] },
      { call: () => ({
        empty: undefined,
        param: null,
        call: [
          'sub'
        ]
      }) },
      { empty: undefined }
    ] as Model.Graph<Class>;

    it('returns the unraveled graph', () => {
      expect(Class.unravel(graph)).toBe('{ id sub{id} call(param:null){sub} }');
    });
  });

  describe('statically valuating model properties', () => {
    const model = new Class({
      id: undefined,
      created: null!,
      modified: new Date()
    });

    Object.assign(model['#modified' as keyof Model]!, {
      getTimezoneOffset: () => 120
    });

    it('returns the valuated properties', () => {
      expect(Class.valuate(model, 'id')).toBeUndefined();
    });

    it('returns the valuated null-properties', () => {
      expect(Class.valuate(model, 'created')).toBeNull();
    });

    it('returns the valuated ISO date strings', () => {
      expect(Class.valuate(model, 'modified')).toMatch(/-02:00$/);
    });
  });

  describe('instantiating a model using parts', () => {
    const model = new Class(...values);

    const validate = (value: Class) => {
      expect(value.id).toBe(values[0].id);
      expect(value.created).toBe(values[1].created!.valueOf());
      expect(value.modified).toBe(values[2].modified!.valueOf());
    };

    it('assigns all supplied parts to the model', () => {
      expect(model).toBeInstanceOf(Model);
      expect(model).toBeInstanceOf(Class);
      validate(model);
    });
  });

  describe('assigning parts to a model', () => {
    const model = new Class();

    const validate = (value: Class) => {
      expect(value.id).toBe(values[0].id);
      expect(value.created).toBe(values[1].created!.valueOf());
      expect(value.modified).toBe(values[2].modified!.valueOf());
    };

    it('emits the changed model', (done) => {
      from(model).pipe(
        auditTime(250),
        first()
      ).subscribe((value) => {
        validate(value);
        done();
      });

      model.assign(...values).subscribe(validate);
    });

    it('assigns all supplied parts to the model', () => {
      validate(model);
    });
  });

  describe('assigning null-parts to a model', () => {
    const model = new Class();

    const validate = (value: Class) => {
      expect(value.id).toBeNull();
      expect(value.created).toBeNull();
      expect(value.modified).toBeNull();
    };

    it('emits the changed model', (done) => {
      from(model).pipe(
        auditTime(250),
        first()
      ).subscribe((value) => {
        validate(value);
        done();
      });

      model.assign(...values.flatMap((value) => {
        return Object.keys(value).map((key) => ({
          [key]: null
        })) as Model.Shape<Class>;
      })).subscribe(validate);
    });

    it('assigns all supplied null-parts to the model', () => {
      validate(model);
    });
  });

  describe('clearing a model', () => {
    const model = new Class(...values);

    const validate = (value: Class) => {
      expect(value.id).toBeUndefined();
      expect(value.created).toBeUndefined();
      expect(value.modified).toBeUndefined();
    };

    it('emits the changed model', (done) => {
      from(model).pipe(
        auditTime(250),
        first()
      ).subscribe((value) => {
        validate(value);
        done();
      });

      model.clear().subscribe(validate);
    });

    it('clears the model', () => {
      validate(model);
    });
  });

  describe('clearing a model partially', () => {
    const model = new Class(...values);

    const validate = (value: Class) => {
      expect(value.id).toBe(values[0].id);
      expect(value.created).toBeUndefined();
      expect(value.modified).toBeUndefined();
    };

    it('emits the changed model', (done) => {
      from(model).pipe(
        auditTime(250),
        first()
      ).subscribe((value) => {
        validate(value);
        done();
      });

      model.clear(['created', 'modified']).subscribe(validate);
    });

    it('clears the model partially', () => {
      validate(model);
    });
  });

  describe('committing an operation on an instance', () => {
    const model = new Class(...values);

    it('throws an error because no querier is available', (done) => {
      model.commit('query test').pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('committing an operation on an instance with variables', () => {
    const model = new Class(...values);

    it('throws an error because no querier is available', (done) => {
      model.commit('query test', { }, identity).pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('calling the delete operation on an instance', () => {
    const model = new Class(...values);

    it('throws an error because no querier is available', (done) => {
      model.delete().pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('calling the find operation on an instance', () => {
    const model = new Class(...values);

    it('throws an error because no querier is available', (done) => {
      model.find([], { }).pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('calling the save operation on an instance', () => {
    const model = new Class(...values);

    it('throws an error because no querier is available', (done) => {
      model.save([]).pipe(catchError((error) => {
        expect(error).toBeInstanceOf(ReferenceError);
        done();

        return EMPTY;
      })).subscribe();
    });
  });

  describe('serializing a model', () => {
    const model = new Class(...values);

    it('returns the serialized model', () => {
      expect(model.serialize()).toStrictEqual({
        id: values[0].id
      });
    });
  });

  describe('serializing a model shallowly', () => {
    const model = new Class(...values);

    it('returns the serialized model', () => {
      expect(model.serialize(true)).toStrictEqual({
        id: values[0].id
      });
    });
  });

  describe('treemapping a model', () => {
    const model = new Class(...values);

    it('returns the treemapped model', () => {
      expect(model.treemap()).toStrictEqual(['id']);
    });
  });

  describe('treemapping a model shallowly', () => {
    const model = new Class(...values);

    it('returns the treemapped model', () => {
      expect(model.treemap(true)).toStrictEqual(['id']);
    });
  });

});
