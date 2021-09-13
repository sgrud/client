import { HttpClient } from '@sgrud/utils';

describe('@sgrud/utils/http/client', () => {

  const methods = [
    HttpClient.delete.bind(HttpClient),
    HttpClient.get.bind(HttpClient),
    HttpClient.patch.bind(HttpClient),
    HttpClient.post.bind(HttpClient),
    HttpClient.put.bind(HttpClient)
  ];

  const requests = [
    'DELETE',
    'GET',
    'PATCH',
    'POST',
    'PUT'
  ];

  const xhr = {
    status: 200,
    open: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    setRequestHeader: jest.fn(),
    getAllResponseHeaders: jest.fn(),
    upload: { addEventListener: jest.fn() },
    response: { body: null }
  };

  global.XMLHttpRequest = jest.fn().mockImplementation(() => xhr) as any;

  describe('firing a custom request', () => {
    it('dispatches a custom XHR', (done) => {
      const subscription = new HttpClient().handle({
        method: 'HEAD',
        url: 'url'
      }).subscribe((response) => {
        expect(response.response).toMatchObject(xhr.response);
        expect(xhr.open).toHaveBeenCalledWith('HEAD', 'url', true);
        expect(xhr.send).toHaveBeenCalledWith();
      });

      setTimeout(() => {
        xhr.addEventListener.mock.calls.find(([call]) => {
          return call === 'load';
        }).pop()('json');
      });

      subscription.add(done);
    });
  });

  describe.each(methods)('firing a %O request', (method) => {
    const request = requests[methods.indexOf(method)];

    it('dispatches a XHR ' + request, (done) => {
      const subscription = method('url', undefined).subscribe(() => {
        expect(xhr.open).toHaveBeenCalledWith(request, 'url', true);
        expect(xhr.send).toHaveBeenCalledWith();
      });

      setTimeout(() => {
        xhr.addEventListener.mock.calls.reverse().find(([call]) => {
          return call === 'load';
        }).pop()('json');
      });

      subscription.add(done);
    });
  });

});
