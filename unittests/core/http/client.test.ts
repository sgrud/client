import xhr from '.mocks/xhr.mock';
import { HttpClient } from '@sgrud/core';

describe('@sgrud/core/http/client', () => {

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
        url: 'url'
      }).subscribe((response) => {
        expect(response.response).toBe(xhr.response);
        expect(xhr.open).toHaveBeenCalledWith('HEAD', 'url', true);
        expect(xhr.send).toHaveBeenCalledWith();
      });

      subscription.add(done);
      xhr.trigger('load');
    });
  });

  describe.each(methods)('firing a %O request', (method) => {
    const request = requests[methods.indexOf(method)];

    it('dispatches a XHR ' + request, (done) => {
      const subscription = method('url', undefined).subscribe(() => {
        expect(xhr.open).toHaveBeenCalledWith(request, 'url', true);
        expect(xhr.send).toHaveBeenCalledWith();
      });

      subscription.add(done);
      xhr.trigger('load');
    });
  });

});
