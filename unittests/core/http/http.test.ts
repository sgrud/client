/* eslint-disable @typescript-eslint/unbound-method */

import { Http } from '@sgrud/core';
import express from 'express';
import { Server } from 'http';
import { map } from 'rxjs';

describe('@sgrud/core/http/http', () => {

  /*
   * Fixtures
   */

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/', (_, r) => r.send())
    .listen(location.port));

  afterEach(() => [open, send].forEach((i) => i.mockClear()));
  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');

  /*
   * Variables
   */

  const table = [
    ['DELETE', Http.delete.bind(Http)],
    ['GET', Http.get.bind(Http)],
    ['HEAD', Http.head.bind(Http)],
    ['PATCH', Http.patch.bind(Http)],
    ['POST', Http.post.bind(Http)],
    ['PUT', Http.put.bind(Http)]
  ] as const;

  /*
   * Unittests
   */

  describe('calling the abstract constructor', () => {
    const construct = () => new (Http as any)();

    it('throws an error', () => {
      expect(construct).toThrowError(TypeError);
    });
  });

  describe('firing a custom request', () => {
    const request = Http.request({
      method: 'HEAD',
      url: '/path'
    });

    it('dispatches a custom request', (done) => {
      request.pipe(map(() => {
        expect(open).toBeCalledWith('HEAD', '/path', true);
        expect(send).toBeCalledWith();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe.each(table)('firing a %s request', (type, method) => {
    const request = method('/path', undefined);

    it('dispatches a request of type ' + type, (done) => {
      request.pipe(map(() => {
        expect(open).toBeCalledWith(type, '/path', true);
        expect(send).toBeCalledWith();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
