import { Linker, Symbol, Target } from '@sgrud/core';
import { Model, Querier } from '@sgrud/data';
import { forkJoin, Observable, of } from 'rxjs';

describe('@sgrud/data/querier/querier', () => {

  afterEach(() => [mockOne, mockTwo].forEach((i) => i.mockClear()));
  const mockOne = jest.fn();
  const mockTwo = jest.fn();

  class ClassOne extends Model<ClassOne> {
    protected readonly [Symbol.toStringTag]: string = 'ClassOne';
  }

  class ClassTwo extends Model<ClassTwo> {
    protected readonly [Symbol.toStringTag]: string = 'ClassTwo';
  }

  @Target<typeof QuerierOne>()
  class QuerierOne extends Querier {
    public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
      'mutation',
      'query'
    ]);

    public override commit(operation: Querier.Operation): Observable<any> {
      mockOne(operation);

      const key = /(get|save)Class(One|Two)s/.exec(operation)?.[0];
      return of({ [key || 'test']: { result: [{ }], total: 1 } });
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
      mockTwo(operation);

      const key = /(get|save)Class(One|Two)s/.exec(operation)?.[0];
      return of({ [key || 'test']: { result: [{ }], total: 1 } });
    }

    public override priority(model: Model.Type<any>): number {
      return model === ClassTwo ? 100 : 10;
    }
  }

  describe('targeting Querier subclasses', () => {
    const linker = new Linker<typeof Querier>();
    const links = linker.getAll(Querier);

    it('appends the targets to the queriers', () => {
      expect(links).toContain(linker.get(QuerierOne));
      expect(links).toContain(linker.get(QuerierTwo));
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
        expect(mockOne.mock.calls[0][0]).toBe('query one');
        expect(mockOne.mock.calls[1][0]).toBe('query two');
        expect(mockOne.mock.calls[2][0]).toBe('mutation one');
        expect(mockTwo.mock.calls[0][0]).toBe('mutation two');
        done();
      });
    });
  });

  describe('statically calling the deleteAll operation', () => {
    it('dispatches the operation through the prioritized querier', (done) => {
      forkJoin([
        ClassOne.deleteAll(['id']),
        ClassTwo.deleteAll(['id'])
      ]).subscribe(() => {
        expect(mockOne.mock.calls[0][0]).toContain('mutation deleteAll');
        expect(mockTwo.mock.calls[0][0]).toContain('mutation deleteAll');
        expect(mockOne.mock.calls[0][0]).toContain('deleteClassOnes');
        expect(mockTwo.mock.calls[0][0]).toContain('deleteClassTwos');
        done();
      });
    });
  });

  describe('statically calling the deleteOne operation', () => {
    it('dispatches the operation through the prioritized querier', (done) => {
      forkJoin([
        ClassOne.deleteOne('id'),
        ClassTwo.deleteOne('id')
      ]).subscribe(() => {
        expect(mockOne.mock.calls[0][0]).toContain('mutation deleteOne');
        expect(mockTwo.mock.calls[0][0]).toContain('mutation deleteOne');
        expect(mockOne.mock.calls[0][0]).toContain('deleteClassOne');
        expect(mockTwo.mock.calls[0][0]).toContain('deleteClassTwo');
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
        expect(mockOne.mock.calls[0][0]).toContain('query findAll');
        expect(mockOne.mock.calls[1][0]).toContain('query findAll');
        expect(mockOne.mock.calls[0][0]).toContain('getClassOnes');
        expect(mockOne.mock.calls[1][0]).toContain('getClassTwos');
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
        expect(mockOne.mock.calls[0][0]).toContain('query findOne');
        expect(mockOne.mock.calls[1][0]).toContain('query findOne');
        expect(mockOne.mock.calls[0][0]).toContain('getClassOne');
        expect(mockOne.mock.calls[1][0]).toContain('getClassTwo');
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
        expect(mockOne.mock.calls[0][0]).toContain('mutation saveAll');
        expect(mockTwo.mock.calls[0][0]).toContain('mutation saveAll');
        expect(mockOne.mock.calls[0][0]).toContain('saveClassOnes');
        expect(mockTwo.mock.calls[0][0]).toContain('saveClassTwos');
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
        expect(mockOne.mock.calls[0][0]).toContain('mutation saveOne');
        expect(mockTwo.mock.calls[0][0]).toContain('mutation saveOne');
        expect(mockOne.mock.calls[0][0]).toContain('saveClassOne');
        expect(mockTwo.mock.calls[0][0]).toContain('saveClassTwo');
        done();
      });
    });
  });

  describe('committing an operation on an instance', () => {
    const mutationClassOne = new ClassOne();
    const mutationClassTwo = new ClassTwo();
    const queryClassOne = new ClassOne();
    const queryClassTwo = new ClassTwo();

    it('commits the operation through the prioritized querier', (done) => {
      forkJoin([
        mutationClassOne.commit<any>('mutation one'),
        mutationClassTwo.commit<any>('mutation two'),
        queryClassOne.commit<any>('query one'),
        queryClassTwo.commit<any>('query two')
      ]).subscribe(() => {
        expect(mockOne.mock.calls[0][0]).toBe('mutation one');
        expect(mockTwo.mock.calls[0][0]).toBe('mutation two');
        expect(mockOne.mock.calls[1][0]).toBe('query one');
        expect(mockOne.mock.calls[2][0]).toBe('query two');
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
        expect(mockOne.mock.calls[0][0]).toContain('mutation deleteOne');
        expect(mockTwo.mock.calls[0][0]).toContain('mutation deleteOne');
        expect(mockOne.mock.calls[0][0]).toContain('deleteClassOne');
        expect(mockTwo.mock.calls[0][0]).toContain('deleteClassTwo');
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
        expect(mockOne.mock.calls[0][0]).toContain('query findOne');
        expect(mockOne.mock.calls[1][0]).toContain('query findOne');
        expect(mockOne.mock.calls[0][0]).toContain('getClassOne');
        expect(mockOne.mock.calls[1][0]).toContain('getClassTwo');
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
        expect(mockOne.mock.calls[0][0]).toContain('mutation saveOne');
        expect(mockTwo.mock.calls[0][0]).toContain('mutation saveOne');
        expect(mockOne.mock.calls[0][0]).toContain('saveClassOne');
        expect(mockTwo.mock.calls[0][0]).toContain('saveClassTwo');
        done();
      });
    });
  });

});
