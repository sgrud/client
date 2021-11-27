import { Linker, Target } from '@sgrud/core';
import { Model, Querier } from '@sgrud/data';
import { forkJoin, Observable, of } from 'rxjs';

describe('@sgrud/data/querier/querier', () => {

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

  @Target<typeof QuerierOne>()
  class QuerierOne extends Querier {
    public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
      'query', 'mutation'
    ]);

    public override commit(operation: Querier.Operation): Observable<any> {
      mocks[0](operation);
      const key = /(get|save)Class(One|Two)s/.exec(operation)?.[0];
      return of({ [key ?? 'test']: { result: [{ }], total: 1 } });
    }

    public override priority(): number {
      return 50;
    }
  }

  @Target<typeof QuerierTwo>()
  class QuerierTwo extends Querier {
    public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
      'mutation'
    ]);

    public override commit(operation: Querier.Operation): Observable<any> {
      mocks[1](operation);
      const key = /(get|save)Class(One|Two)s/.exec(operation)?.[0];
      return of({ [key ?? 'test']: { result: [{ }], total: 1 } });
    }

    public override priority(model: Model.Type<any>): number {
      return model === ClassTwo ? 100 : 10;
    }
  }

  afterEach(() => {
    mocks[0].mockClear();
    mocks[1].mockClear();
  });

  describe('targeting Querier subclasses', () => {
    const linker = new Linker<typeof Querier>();
    const querier = linker.getAll(Querier);

    it('appends the targets to the queriers', () => {
      expect(querier).toContain(linker.get(QuerierOne));
      expect(querier).toContain(linker.get(QuerierTwo));
    });
  });

  describe('statically committing an operation', () => {
    it('commits the operation through the prioritized querier', (done) => {
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
    it('dispatches the operation through the prioritized querier', (done) => {
      forkJoin([
        ClassOne.deleteAll(['uuid']),
        ClassTwo.deleteAll(['uuid'])
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
    it('dispatches the operation through the prioritized querier', (done) => {
      forkJoin([
        ClassOne.deleteOne('uuid'),
        ClassTwo.deleteOne('uuid')
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
    it('dispatches the operation through the prioritized querier', (done) => {
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
    it('dispatches the operation through the prioritized querier', (done) => {
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
    it('dispatches the operation through the prioritized querier', (done) => {
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
    it('dispatches the operation through the prioritized querier', (done) => {
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

    it('commits the operation through the prioritized querier', (done) => {
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

    it('deletes the instance through the prioritized querier', (done) => {
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

    it('finds the instance through the prioritized querier', (done) => {
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

    it('saves the instance through the prioritized querier', (done) => {
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
