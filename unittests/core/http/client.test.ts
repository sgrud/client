import { HttpClient } from '@sgrud/core';
import express from 'express';
import { Server } from 'http';

describe('@sgrud/core/http/client', () => {

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/', (_, r) => r.send())
    .listen(location.port));

  afterEach(() => [open, send].forEach((i) => i.mockClear()));
  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');

  const clients = [
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

  describe.each(clients)('firing a custom request through %O', (client) => {
    it('dispatches a custom XHR', (done) => {
      client.handle({
        method: 'HEAD',
        url: '/head'
      }).subscribe(() => {
        expect(open).toHaveBeenCalledWith('HEAD', '/head', true);
        expect(send).toHaveBeenCalledWith();
        done();
      });
    });
  });

  describe.each(methods)('firing a %O request', (method) => {
    const request = requests[methods.indexOf(method)];

    it('dispatches a XHR ' + request, (done) => {
      method('/path', undefined).subscribe(() => {
        expect(open).toHaveBeenCalledWith(request, '/path', true);
        expect(send).toHaveBeenCalledWith();
        done();
      });
    });
  });

});
