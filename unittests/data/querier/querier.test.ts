import { Linker, Target } from '@sgrud/core';
import { Model, Querier } from '@sgrud/data';
import { Observable, forkJoin, map } from 'rxjs';

describe('@sgrud/data/querier/querier', () => {

  /*
   * Fixtures
   */

  afterEach(() => [commitOne, commitTwo].forEach((i) => i.mockClear()));
  const commitOne = jest.fn((operation: Querier.Operation) => operation);
  const commitTwo = jest.fn((operation: Querier.Operation) => operation);

  /*
   * Variables
   */

  class ClassOne extends Model<ClassOne> {

    protected readonly [Symbol.toStringTag]: string = 'ClassOne';

  }

  class ClassTwo extends Model<ClassTwo> {

    protected readonly [Symbol.toStringTag]: string = 'ClassTwo';

  }

  @Target()
  class QuerierOne extends Querier {

    public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
      'mutation',
      'query'
    ]);

    public override commit(operation: Querier.Operation): Observable<any> {
      return new Observable((observer) => {
        const key = /(get|save)Class(One|Two)s/.exec(commitOne(operation))?.[0];
        observer.next({ [key || 'test']: { result: [{}], total: 1 } });
        observer.complete();
      });
    }

    public override priority(): number {
      return 50;
    }

  }

  @Target()
  class QuerierTwo extends Querier {

    public override readonly types: Set<Querier.Type> = new Set<Querier.Type>([
      'mutation'
    ]);

    public override commit(operation: Querier.Operation): Observable<any> {
      return new Observable((observer) => {
        const key = /(get|save)Class(One|Two)s/.exec(commitTwo(operation))?.[0];
        observer.next({ [key || 'test']: { result: [{}], total: 1 } });
        observer.complete();
      });
    }

    public override priority(model: Model.Type<any>): number {
      return model === ClassTwo ? 100 : 10;
    }

  }

  /*
   * Unittests
   */

  describe('targeting querier subclasses', () => {
    const linker = new Linker<typeof Querier>();
    const links = linker.getAll(Querier);

    it('appends the targets to the queriers', () => {
      expect(links).toContain(linker.get(QuerierOne));
      expect(links).toContain(linker.get(QuerierTwo));
    });
  });

  describe('statically committing an operation', () => {
    const operation = forkJoin([
      ClassOne.commit('query one'),
      ClassTwo.commit('query two'),
      ClassOne.commit('mutation one'),
      ClassTwo.commit('mutation two')
    ]);

    it('commits the operation through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toBe('query one');
        expect(commitOne.mock.calls[1][0]).toBe('query two');
        expect(commitOne.mock.calls[2][0]).toBe('mutation one');
        expect(commitTwo.mock.calls[0][0]).toBe('mutation two');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('statically calling the deleteAll operation', () => {
    const operation = forkJoin([
      ClassOne.deleteAll(['uuid']),
      ClassTwo.deleteAll(['uuid'])
    ]);

    it('dispatches the operation through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('mutation deleteAll');
        expect(commitOne.mock.calls[0][0]).toContain('deleteClassOnes');
        expect(commitTwo.mock.calls[0][0]).toContain('mutation deleteAll');
        expect(commitTwo.mock.calls[0][0]).toContain('deleteClassTwos');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('statically calling the deleteOne operation', () => {
    const operation = forkJoin([
      ClassOne.deleteOne('uuid'),
      ClassTwo.deleteOne('uuid')
    ]);

    it('dispatches the operation through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('mutation deleteOne');
        expect(commitOne.mock.calls[0][0]).toContain('deleteClassOne');
        expect(commitTwo.mock.calls[0][0]).toContain('mutation deleteOne');
        expect(commitTwo.mock.calls[0][0]).toContain('deleteClassTwo');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('statically calling the findAll operation', () => {
    const operation = forkJoin([
      ClassOne.findAll({}, []),
      ClassTwo.findAll({}, [])
    ]);

    it('dispatches the operation through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('query findAll');
        expect(commitOne.mock.calls[0][0]).toContain('getClassOnes');
        expect(commitOne.mock.calls[1][0]).toContain('query findAll');
        expect(commitOne.mock.calls[1][0]).toContain('getClassTwos');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('statically calling the findOne operation', () => {
    const operation = forkJoin([
      ClassOne.findOne({}, []),
      ClassTwo.findOne({}, [])
    ]);

    it('dispatches the operation through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('query findOne');
        expect(commitOne.mock.calls[0][0]).toContain('getClassOne');
        expect(commitOne.mock.calls[1][0]).toContain('query findOne');
        expect(commitOne.mock.calls[1][0]).toContain('getClassTwo');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('statically calling the saveAll operation', () => {
    const operation = forkJoin([
      ClassOne.saveAll([new ClassOne(), new ClassOne()], []),
      ClassTwo.saveAll([new ClassTwo(), new ClassTwo()], [])
    ]);

    it('dispatches the operation through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('mutation saveAll');
        expect(commitOne.mock.calls[0][0]).toContain('saveClassOnes');
        expect(commitTwo.mock.calls[0][0]).toContain('mutation saveAll');
        expect(commitTwo.mock.calls[0][0]).toContain('saveClassTwos');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('statically calling the saveOne operation', () => {
    const operation = forkJoin([
      ClassOne.saveOne(new ClassOne(), []),
      ClassTwo.saveOne(new ClassTwo(), [])
    ]);

    it('dispatches the operation through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('mutation saveOne');
        expect(commitOne.mock.calls[0][0]).toContain('saveClassOne');
        expect(commitTwo.mock.calls[0][0]).toContain('mutation saveOne');
        expect(commitTwo.mock.calls[0][0]).toContain('saveClassTwo');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('committing an operation on an instance', () => {
    const operation = forkJoin([
      new ClassOne().commit<any>('mutation one'),
      new ClassTwo().commit<any>('mutation two'),
      new ClassOne().commit<any>('query one'),
      new ClassTwo().commit<any>('query two')
    ]);

    it('commits the operation through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toBe('mutation one');
        expect(commitOne.mock.calls[1][0]).toBe('query one');
        expect(commitOne.mock.calls[2][0]).toBe('query two');
        expect(commitTwo.mock.calls[0][0]).toBe('mutation two');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling the delete operation on an instance', () => {
    const operation = forkJoin([
      new ClassOne().delete(),
      new ClassTwo().delete()
    ]);

    it('deletes the instance through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('mutation deleteOne');
        expect(commitOne.mock.calls[0][0]).toContain('deleteClassOne');
        expect(commitTwo.mock.calls[0][0]).toContain('mutation deleteOne');
        expect(commitTwo.mock.calls[0][0]).toContain('deleteClassTwo');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling the find operation on an instance', () => {
    const operation = forkJoin([
      new ClassOne().find([]),
      new ClassTwo().find([])
    ]);

    it('finds the instance through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('query findOne');
        expect(commitOne.mock.calls[0][0]).toContain('getClassOne');
        expect(commitOne.mock.calls[1][0]).toContain('query findOne');
        expect(commitOne.mock.calls[1][0]).toContain('getClassTwo');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling the save operation on an instance', () => {
    const operation = forkJoin([
      new ClassOne().save(),
      new ClassTwo().save()
    ]);

    it('saves the instance through the prioritized querier', (done) => {
      operation.pipe(map(() => {
        expect(commitOne.mock.calls[0][0]).toContain('mutation saveOne');
        expect(commitOne.mock.calls[0][0]).toContain('saveClassOne');
        expect(commitTwo.mock.calls[0][0]).toContain('mutation saveOne');
        expect(commitTwo.mock.calls[0][0]).toContain('saveClassTwo');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
