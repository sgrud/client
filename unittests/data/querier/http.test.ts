import { Linker, Symbol, Target } from '@sgrud/core';
import { HttpQuerier, Model } from '@sgrud/data';
import express from 'express';
import { Server } from 'http';
import { catchError, of } from 'rxjs';

describe('@sgrud/data/querier/http', () => {

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/api/sgrud/v1/insmod', (_, r) => r.send({ }))
    .use('/exception', (_, r) => r.send({ errors: [null] }))
    .use('/', (_, r) => r.send({ }))
    .listen(location.port));

  afterEach(() => [open, send].forEach((i) => i.mockClear()));
  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');

  class Class extends Model<Class> {
    protected readonly [Symbol.toStringTag]: string = 'Class';
  }

  new Linker<Target<HttpQuerier>>([
    [HttpQuerier, new HttpQuerier('/api')]
  ]);

  describe('instantiating a HttpQuerier without arguments', () => {
    const querier = new HttpQuerier();

    const opened = [
      [
        'GET',
        location.origin + '/api/sgrud/v1/insmod',
        true
      ]
    ];

    it('instanitates a kernel to retreive the api endpoint', () => {
      expect(querier).toBeInstanceOf(HttpQuerier);

      opened.forEach((n, i) => {
        expect(open).toHaveBeenNthCalledWith(++i, ...n);
      });
    });
  });

  describe('targeting the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const links = linker.getAll(HttpQuerier);

    it('appends the HttpQuerier to the queriers', () => {
      expect(links).toContain(linker.get(HttpQuerier));
    });
  });

  describe('statically committing an operation through the HttpQuerier', () => {
    const operation = 'query test';
    const variables = { query: 'test' };

    const opened = [
      'POST',
      '/api',
      true
    ];

    const requested = JSON.stringify({
      query: operation,
      variables
    });

    it('commits the operation through the HttpQuerier', (done) => {
      Class.commit(operation, variables).subscribe(() => {
        expect(open).toHaveBeenCalledWith(...opened);
        expect(send).toHaveBeenCalledWith(requested);
        done();
      });
    });
  });

  describe('re-targeting the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const operation = 'mutation test';
    const variables = { mutation: 'test' };

    const opened = [
      'POST',
      '/path',
      true
    ];

    const requested = JSON.stringify({
      query: operation,
      variables
    });

    it('overrides the previously targeted HttpQuerier', () => {
      linker.set(HttpQuerier, new HttpQuerier('/path', new Map([[Class, 50]])));

      const links = linker.getAll(HttpQuerier);
      expect(links).toContain(linker.get(HttpQuerier));
    });

    it('overrides the previously targeted HttpQuerier', (done) => {
      Class.commit(operation, variables).subscribe(() => {
        expect(open).toHaveBeenCalledWith(...opened);
        expect(send).toHaveBeenCalledWith(requested);
        done();
      });
    });
  });

  describe('receiving an exception through the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const operation = 'query exception';

    const opened = [
      'POST',
      '/exception',
      true
    ];

    const requested = JSON.stringify({
      query: operation
    });

    it('emits the error to the observer', (done) => {
      linker.set(HttpQuerier, new HttpQuerier('/exception', new Map()));

      Class.commit(operation).pipe(
        catchError((error) => of(error))
      ).subscribe((error) => {
        expect(error).toBeInstanceOf(AggregateError);
        expect(open).toHaveBeenCalledWith(...opened);
        expect(send).toHaveBeenCalledWith(requested);
        done();
      });
    });
  });

});
