import { Model, Query } from '@sgrud/data';
import { Linker, Target } from '@sgrud/utils';
import { forkJoin, Observable, of } from 'rxjs';

describe('@sgrud/data/query/query', () => {

  const mocks = [
    jest.fn(),
    jest.fn()
  ];

  class ClassOne extends Model<ClassOne> {
    protected readonly [Symbol.toStringTag]: string = 'ClassOne';
  }

  class ClassTwo extends Model<ClassTwo> {
    protected readonly [Symbol.toStringTag]: string = 'ClassTwo';
  }

  @Target()
  class QueryOne extends Query {
    public override readonly types: Set<Query.Type> = new Set<Query.Type>([
      'query', 'mutation'
    ]);

    public override commit(operation: Query.Value): Observable<any> {
      mocks[0](operation);
      const key = /(get|save)Class(One|Two)s/.exec(operation)?.[0];
      return of({ [key || 'test']: { result: [{ }], total: 1 } });
    }

    public override priority(): number {
      return 50;
    }
  }

  @Target()
  class QueryTwo extends Query {
    public override readonly types: Set<Query.Type> = new Set<Query.Type>([
      'mutation'
    ]);

    public override commit(operation: Query.Value): Observable<any> {
      mocks[1](operation);
      const key = /(get|save)Class(One|Two)s/.exec(operation)?.[0];
      return of({ [key || 'test']: { result: [{ }], total: 1 } });
    }

    public override priority(model: Model.Type<any>): number {
      return model === ClassTwo ? 100 : 10;
    }
  }

  beforeEach(() => {
    mocks[0].mockClear();
    mocks[1].mockClear();
  });

  describe('targeting Query subclasses', () => {
    const linker = new Linker();
    const pool = linker.getAll(Query as Target<Query>);

    it('appends the targets to the query pool', () => {
      expect(pool).toContain(linker.get(QueryOne));
      expect(pool).toContain(linker.get(QueryTwo));
    });
  });

  describe('statically committing an operation', () => {
    it('commits the operation through the prioritized query', (done) => {
      forkJoin([
        ClassOne.commit('query one'),
        ClassTwo.commit('query two'),
        ClassOne.commit('mutation one'),
        ClassTwo.commit('mutation two')
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toBe('query one');
        expect(mocks[0].mock.calls[1][0]).toBe('query two');
        expect(mocks[0].mock.calls[2][0]).toBe('mutation one');
        expect(mocks[1].mock.calls[0][0]).toBe('mutation two');
        done();
      });
    });
  });

  describe('statically calling the deleteAll operation', () => {
    it('dispatches the operation through the prioritized query', (done) => {
      forkJoin([
        ClassOne.deleteAll('id'),
        ClassTwo.deleteAll('id')
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('mutation deleteAll');
        expect(mocks[1].mock.calls[0][0]).toContain('mutation deleteAll');
        expect(mocks[0].mock.calls[0][0]).toContain('deleteClassOnes');
        expect(mocks[1].mock.calls[0][0]).toContain('deleteClassTwos');
        done();
      });
    });
  });

  describe('statically calling the deleteOne operation', () => {
    it('dispatches the operation through the prioritized query', (done) => {
      forkJoin([
        ClassOne.deleteOne('id'),
        ClassTwo.deleteOne('id')
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('mutation deleteOne');
        expect(mocks[1].mock.calls[0][0]).toContain('mutation deleteOne');
        expect(mocks[0].mock.calls[0][0]).toContain('deleteClassOne');
        expect(mocks[1].mock.calls[0][0]).toContain('deleteClassTwo');
        done();
      });
    });
  });

  describe('statically calling the findAll operation', () => {
    it('dispatches the operation through the prioritized query', (done) => {
      forkJoin([
        ClassOne.findAll({ }, []),
        ClassTwo.findAll({ }, [])
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('query findAll');
        expect(mocks[0].mock.calls[1][0]).toContain('query findAll');
        expect(mocks[0].mock.calls[0][0]).toContain('getClassOnes');
        expect(mocks[0].mock.calls[1][0]).toContain('getClassTwos');
        done();
      });
    });
  });

  describe('statically calling the findOne operation', () => {
    it('dispatches the operation through the prioritized query', (done) => {
      forkJoin([
        ClassOne.findOne({ }, []),
        ClassTwo.findOne({ }, [])
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('query findOne');
        expect(mocks[0].mock.calls[1][0]).toContain('query findOne');
        expect(mocks[0].mock.calls[0][0]).toContain('getClassOne');
        expect(mocks[0].mock.calls[1][0]).toContain('getClassTwo');
        done();
      });
    });
  });

  describe('statically calling the saveAll operation', () => {
    it('dispatches the operation through the prioritized query', (done) => {
      forkJoin([
        ClassOne.saveAll([new ClassOne(), new ClassOne()], []),
        ClassTwo.saveAll([new ClassTwo(), new ClassTwo()], [])
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('mutation saveAll');
        expect(mocks[1].mock.calls[0][0]).toContain('mutation saveAll');
        expect(mocks[0].mock.calls[0][0]).toContain('saveClassOnes');
        expect(mocks[1].mock.calls[0][0]).toContain('saveClassTwos');
        done();
      });
    });
  });

  describe('statically calling the saveOne operation', () => {
    it('dispatches the operation through the prioritized query', (done) => {
      forkJoin([
        ClassOne.saveOne(new ClassOne(), []),
        ClassTwo.saveOne(new ClassTwo(), [])
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('mutation saveOne');
        expect(mocks[1].mock.calls[0][0]).toContain('mutation saveOne');
        expect(mocks[0].mock.calls[0][0]).toContain('saveClassOne');
        expect(mocks[1].mock.calls[0][0]).toContain('saveClassTwo');
        done();
      });
    });
  });

  describe('committing an operation on an instance', () => {
    const queryClassOne = new ClassOne();
    const queryClassTwo = new ClassTwo();
    const mutationClassOne = new ClassOne();
    const mutationClassTwo = new ClassTwo();

    it('commits the operation through the prioritized query', (done) => {
      forkJoin([
        queryClassOne.commit<any>('query one'),
        queryClassTwo.commit<any>('query two'),
        mutationClassOne.commit<any>('mutation one'),
        mutationClassTwo.commit<any>('mutation two')
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toBe('query one');
        expect(mocks[0].mock.calls[1][0]).toBe('query two');
        expect(mocks[0].mock.calls[2][0]).toBe('mutation one');
        expect(mocks[1].mock.calls[0][0]).toBe('mutation two');
        done();
      });
    });
  });

  describe('calling the delete operation on an instance', () => {
    const classOne = new ClassOne();
    const classTwo = new ClassTwo();

    it('deletes the instance through the prioritized query', (done) => {
      forkJoin([
        classOne.delete(),
        classTwo.delete()
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('mutation deleteOne');
        expect(mocks[1].mock.calls[0][0]).toContain('mutation deleteOne');
        expect(mocks[0].mock.calls[0][0]).toContain('deleteClassOne');
        expect(mocks[1].mock.calls[0][0]).toContain('deleteClassTwo');
        done();
      });
    });
  });

  describe('calling the find operation on an instance', () => {
    const classOne = new ClassOne();
    const classTwo = new ClassTwo();

    it('finds the instance through the prioritized query', (done) => {
      forkJoin([
        classOne.find([]),
        classTwo.find([])
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('query findOne');
        expect(mocks[0].mock.calls[1][0]).toContain('query findOne');
        expect(mocks[0].mock.calls[0][0]).toContain('getClassOne');
        expect(mocks[0].mock.calls[1][0]).toContain('getClassTwo');
        done();
      });
    });
  });

  describe('calling the save operation on an instance', () => {
    const classOne = new ClassOne();
    const classTwo = new ClassTwo();

    it('saves the instance through the prioritized query', (done) => {
      forkJoin([
        classOne.save(),
        classTwo.save()
      ]).subscribe(() => {
        expect(mocks[0].mock.calls[0][0]).toContain('mutation saveOne');
        expect(mocks[1].mock.calls[0][0]).toContain('mutation saveOne');
        expect(mocks[0].mock.calls[0][0]).toContain('saveClassOne');
        expect(mocks[1].mock.calls[0][0]).toContain('saveClassTwo');
        done();
      });
    });
  });

});
