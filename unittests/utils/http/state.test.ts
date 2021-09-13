import { HttpClient, HttpState, Linker } from '@sgrud/utils';
import { filter } from 'rxjs';

describe('@sgrud/utils/http/state', () => {

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

  describe('firing a request', () => {
    const state = new Linker().get(HttpState) as HttpState;

    it('dispatches a corresponding XHR', (done) => {
      const subscription = HttpClient.get('one').subscribe();

      const requests = state.requests.pipe(
        filter((next) => Boolean(next.length))
      ).subscribe((next) => {
        expect(next.shift()?.response).toMatchObject(xhr.response);
        requests.unsubscribe();
      });

      setTimeout(() => {
        xhr.addEventListener.mock.calls.find(([call]) => {
          return call === 'load';
        }).pop()('json');
      });

      subscription.add(done);
    });
  });

});
