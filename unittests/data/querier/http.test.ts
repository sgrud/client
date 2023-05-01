import { Linker, Target } from '@sgrud/core';
import { HttpQuerier, Model } from '@sgrud/data';
import express from 'express';
import { Server } from 'http';
import { catchError, map, of } from 'rxjs';

describe('@sgrud/data/querier/http', () => {

  /*
   * Fixtures
   */

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/error', (_, r) => r.send({ errors: [null] }))
    .use('/', (_, r) => r.send({}))
    .listen(location.port));

  afterEach(() => [open, send].forEach((i) => i.mockClear()));
  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');

  /*
   * Variables
   */

  class Class extends Model<Class> {

    protected readonly [Symbol.toStringTag]: string = 'Class';

  }

  /*
   * Unittests
   */

  describe('committing an operation through the http querier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const commit = Class.commit('query test', { query: 'test' });

    it('commits the operation through the http querier', (done) => {
      linker.set(HttpQuerier, new HttpQuerier('/path'));

      commit.pipe(map(() => {
        expect(open).toBeCalledWith('POST', '/path', true);
        expect(send).toBeCalledWith(JSON.stringify({
          query: 'query test',
          variables: {
            query: 'test'
          }
        }));
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('re-targeting the http querier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const commit = Class.commit('mutation test', { mutation: 'test' });

    it('overrides the previously targeted http querier', (done) => {
      linker.set(HttpQuerier, new HttpQuerier('/path', new Map([
        [Class, 50]
      ])));

      commit.pipe(map(() => {
        expect(open).toBeCalledWith('POST', '/path', true);
        expect(send).toBeCalledWith(JSON.stringify({
          query: 'mutation test',
          variables: {
            mutation: 'test'
          }
        }));
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('receiving an error through the http querier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const commit = Class.commit('query error').pipe(
      catchError((error) => of(error))
    );

    it('emits the error to the observer', (done) => {
      linker.set(HttpQuerier, new HttpQuerier('/error', new Map()));

      commit.pipe(map((next) => {
        expect(next).toBeInstanceOf(AggregateError);
        expect(open).toBeCalledWith('POST', '/error', true);
        expect(send).toBeCalledWith(JSON.stringify({
          query: 'query error'
        }));
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
