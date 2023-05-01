import { Model } from '@sgrud/data';
import { auditTime, firstValueFrom, from, map } from 'rxjs';

describe('@sgrud/data/model/model', () => {

  /*
   * Variables
   */

  class Class extends Model<Class> {

    protected readonly [Symbol.toStringTag]: string = 'ModelEntity';

  }

  const values = [
    { uuid: 'uuid' },
    { created: new Date(0) },
    { modified: new Date() }
  ] as const;

  /*
   * Unittests
   */

  describe('statically committing an operation', () => {
    const operation = Class.commit('query test');

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('statically calling the deleteAll operation', () => {
    const operation = Class.deleteAll(['uuid']);

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('statically calling the deleteOne operation', () => {
    const operation = Class.deleteOne('uuid');

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('statically calling the findAll operation', () => {
    const operation = Class.findAll({}, []);

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('statically calling the findOne operation', () => {
    const operation = Class.findOne({}, []);

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('statically calling the saveAll operation', () => {
    const operation = Class.saveAll([new Class(...values)], []);

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('statically calling the saveOne operation', () => {
    const operation = Class.saveOne(new Class(...values), []);

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('statically serializing a model', () => {
    const result = Class.serialize(new Class(...values));

    it('returns the serialized model', () => {
      expect(result).toStrictEqual(values[0]);
    });
  });

  describe('statically serializing a model shallowly', () => {
    const result = Class.serialize(new Class(...values), true);

    it('returns the serialized model', () => {
      expect(result).toStrictEqual(values[0]);
    });
  });

  describe('statically treemapping a model', () => {
    const result = Class.treemap(new Class(...values));

    it('returns the treemapped model', () => {
      expect(result).toStrictEqual(Object.keys(values[0]));
    });
  });

  describe('statically treemapping a model shallowly', () => {
    const result = Class.treemap(new Class(...values), true);

    it('returns the treemapped model', () => {
      expect(result).toStrictEqual(Object.keys(values[0]));
    });
  });

  describe('statically unraveling a graph', () => {
    const result = Class.unravel([
      undefined,
      'uuid',
      { sub: [
        'uuid'
      ] },
      { method: () => ({
        empty: undefined!,
        param: null!,
        method: [
          'sub'
        ]
      }) },
      { empty: undefined! }
    ] as Model.Graph<Class>);

    it('returns the unraveled graph', () => {
      expect(result).toBe('{ uuid sub{uuid} method(param:null){sub} }');
    });
  });

  describe('statically valuating model properties', () => {
    const model = new Class({
      uuid: null!,
      created: undefined!,
      modified: new Date()
    });

    Object.assign(model['#modified' as keyof Model]!, {
      getTimezoneOffset: () => 120
    });

    it('returns the valuated properties', () => {
      expect(Class.valuate(model, 'uuid')).toBeNull();
    });

    it('returns the valuated null-properties', () => {
      expect(Class.valuate(model, 'created')).toBeUndefined();
    });

    it('returns the valuated date strings with correct offset', () => {
      expect(Class.valuate(model, 'modified')).toMatch(/-02:00$/);
    });
  });

  describe('instantiating a model using parts', () => {
    const model = new Class(...values);

    it('assigns all supplied parts to the model', () => {
      expect(model).toBeInstanceOf(Model);
      expect(model).toBeInstanceOf(Class);
      expect(model.uuid).toBe(values[0].uuid);
      expect(model.created).toBe(values[1].created.valueOf());
      expect(model.modified).toBe(values[2].modified.valueOf());
    });
  });

  describe('assigning parts to a model', () => {
    const model = new Class();

    it('assigns all supplied parts to the emitted model', (done) => {
      const changes = from(model).pipe(auditTime(250), map((next) => {
        expect(next.uuid).toBe(values[0].uuid);
        expect(next.created).toBe(values[1].created.valueOf());
        expect(next.modified).toBe(values[2].modified.valueOf());
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

  describe('assigning null-parts to a model', () => {
    const model = new Class();

    it('assigns all supplied null-parts to the emitted model', (done) => {
      const changes = from(model).pipe(auditTime(250), map((next) => {
        expect(next.uuid).toBeNull();
        expect(next.created).toBeNull();
        expect(next.modified).toBeNull();
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

  describe('clearing a model', () => {
    const model = new Class(...values);

    it('clears the emitted model', (done) => {
      const changes = from(model).pipe(auditTime(250), map((next) => {
        expect(next.uuid).toBeUndefined();
        expect(next.created).toBeUndefined();
        expect(next.modified).toBeUndefined();
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

  describe('clearing a model partially', () => {
    const model = new Class(...values);

    it('emits the changed model', (done) => {
      const changes = from(model).pipe(auditTime(250), map((next) => {
        expect(next.uuid).toBe(values[0].uuid);
        expect(next.created).toBeUndefined();
        expect(next.modified).toBeUndefined();
      })).subscribe({
        error: done
      });

      model.clear(['created', 'modified']).pipe(map((next) => {
        changes.unsubscribe();
        expect(next).toBe(model);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('committing an operation on an instance', () => {
    const operation = new Class(...values).commit('query test');

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('calling the delete operation on an instance', () => {
    const operation = new Class(...values).delete();

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('calling the find operation on an instance', () => {
    const operation = new Class(...values).find([], {});

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('calling the save operation on an instance', () => {
    const operation = new Class(...values).save([]);

    it('throws an error because no querier is available', async() => {
      await expect(firstValueFrom(operation)).rejects.toThrow();
    });
  });

  describe('serializing a model', () => {
    const result = new Class(...values).serialize();

    it('returns the serialized model', () => {
      expect(result).toStrictEqual(values[0]);
    });
  });

  describe('serializing a model shallowly', () => {
    const result = new Class(...values).serialize(true);

    it('returns the serialized model', () => {
      expect(result).toStrictEqual(values[0]);
    });
  });

  describe('treemapping a model', () => {
    const result = new Class(...values).treemap();

    it('returns the treemapped model', () => {
      expect(result).toStrictEqual(Object.keys(values[0]));
    });
  });

  describe('treemapping a model shallowly', () => {
    const result = new Class(...values).treemap(true);

    it('returns the treemapped model', () => {
      expect(result).toStrictEqual(Object.keys(values[0]));
    });
  });

});
