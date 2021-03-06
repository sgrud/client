import { HttpClient } from '@sgrud/core';
import express from 'express';
import { Server } from 'http';

describe('@sgrud/core/http/client', () => {

  let server = null! as Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/', (_, r) => r.send())
    .listen(58080));

  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');
  afterEach(() => [open, send].forEach((i) => i.mockClear()));

  const targets = [
    HttpClient.prototype,
    new HttpClient()
  ];

  const methods = [
    HttpClient.delete.bind(HttpClient),
    HttpClient.get.bind(HttpClient),
    HttpClient.head.bind(HttpClient),
    HttpClient.patch.bind(HttpClient),
    HttpClient.post.bind(HttpClient),
    HttpClient.put.bind(HttpClient)
  ];

  const requests = [
    'DELETE',
    'GET',
    'HEAD',
    'PATCH',
    'POST',
    'PUT'
  ];

  describe.each(targets)('firing a custom request through %O', (target) => {
    it('dispatches a custom XHR', (done) => {
      const subscription = target.handle({
        method: 'HEAD',
        url: '/head'
      }).subscribe(() => {
        expect(open).toHaveBeenCalledWith('HEAD', '/head', true);
        expect(send).toHaveBeenCalledWith();
      });

      subscription.add(done);
    });
  });

  describe.each(methods)('firing a %O request', (method) => {
    const request = requests[methods.indexOf(method)];

    it('dispatches a XHR ' + request, (done) => {
      const subscription = method('/path', undefined).subscribe(() => {
        expect(open).toHaveBeenCalledWith(request, '/path', true);
        expect(send).toHaveBeenCalledWith();
      });

      subscription.add(done);
    });
  });

});
