import { Linker, Target } from '@sgrud/core';
import { HttpQuerier, Model } from '@sgrud/data';
import express from 'express';
import { Server } from 'http';
import { catchError, of } from 'rxjs';

describe('@sgrud/data/querier/http', () => {

  let server = null! as Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/exception', (_, r) => r.send(exception))
    .use('/', (_, r) => r.send(response))
    .listen(58080));

  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');
  afterEach(() => [open, send].forEach((i) => i.mockClear()));

  const exception = {
    errors: [
      null
    ]
  };

  const response = {
    data: null
  };

  class Class extends Model<Class> {
    protected readonly [Symbol.toStringTag]: string = 'Class';
  }

  new Linker<Target<HttpQuerier>>([
    [HttpQuerier, new HttpQuerier('/api')]
  ]);

  describe('targeting the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const queriers = linker.getAll(HttpQuerier);

    it('appends the HttpQuerier to the queriers', () => {
      expect(queriers).toContain(linker.get(HttpQuerier));
    });
  });

  describe('statically committing an operation through the HttpQuerier', () => {
    const operation = 'query test';
    const request = JSON.stringify({
      query: operation,
      variables: { }
    });

    it('commits the operation through the HttpQuerier', (done) => {
      const subscription = Class.commit(operation).subscribe(() => {
        expect(open).toHaveBeenCalledWith('POST', '/api', true);
        expect(send).toHaveBeenCalledWith(request);
      });

      subscription.add(done);
    });
  });

  describe('re-targeting the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const operation = 'mutation test';
    const request = JSON.stringify({
      query: operation,
      variables: { }
    });

    const update = () => linker.set(
      HttpQuerier, new HttpQuerier('/path', new Map([[Class, 50]]))
    );

    it('overrides the previously targeted HttpQuerier', () => {
      update();

      const querier = linker.getAll(HttpQuerier);
      expect(querier).toContain(linker.get(HttpQuerier));
    });

    it('overrides the previously targeted HttpQuerier', (done) => {
      const subscription = Class.commit(operation).subscribe(() => {
        expect(open).toHaveBeenCalledWith('POST', '/path', true);
        expect(send).toHaveBeenCalledWith(request);
      });

      subscription.add(done);
    });
  });

  describe('receiving an exception through the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const operation = 'query exception';
    const request = JSON.stringify({
      query: operation,
      variables: { }
    });

    const update = () => linker.set(
      HttpQuerier, new HttpQuerier('/exception', new Map())
    );

    it('', (done) => {
      update();

      const subscription = Class.commit(operation).pipe(
        catchError((error) => of(error))
      ).subscribe((error) => {
        expect(open).toHaveBeenCalledWith('POST', '/exception', true);
        expect(send).toHaveBeenCalledWith(request);
        expect(error).toBe(exception.errors[0]);
      });

      subscription.add(done);
    });
  });

});
