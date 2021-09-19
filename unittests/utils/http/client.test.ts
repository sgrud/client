import { HttpClient } from '@sgrud/utils';

describe('@sgrud/utils/http/client', () => {

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

  const xhrMock = {
    status: 200,
    open: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    setRequestHeader: jest.fn(),
    getAllResponseHeaders: jest.fn(),
    upload: { addEventListener: jest.fn() },
    response: { body: null }
  };

  afterEach(() => xhrMock.addEventListener.mockClear());
  global.XMLHttpRequest = jest.fn().mockImplementation(() => xhrMock) as any;

  describe('firing a custom request', () => {
    it('dispatches a custom XHR', (done) => {
      const subscription = new HttpClient().handle({
        method: 'HEAD',
        url: 'url'
      }).subscribe((response) => {
        expect(response.response).toMatchObject(xhrMock.response);
        expect(xhrMock.open).toHaveBeenCalledWith('HEAD', 'url', true);
        expect(xhrMock.send).toHaveBeenCalledWith();
      });

      setTimeout(() => {
        xhrMock.addEventListener.mock.calls.find(([call]) => {
          return call === 'load';
        })[1]({ type: 'load' });
      });

      subscription.add(done);
    });
  });

  describe.each(methods)('firing a %O request', (method) => {
    const request = requests[methods.indexOf(method)];

    it('dispatches a XHR ' + request, (done) => {
      const subscription = method('url', undefined).subscribe(() => {
        expect(xhrMock.open).toHaveBeenCalledWith(request, 'url', true);
        expect(xhrMock.send).toHaveBeenCalledWith();
      });

      setTimeout(() => {
        xhrMock.addEventListener.mock.calls.find(([call]) => {
          return call === 'load';
        })[1]({ type: 'load' });
      });

      subscription.add(done);
    });
  });

});
