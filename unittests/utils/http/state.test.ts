import { HttpClient, HttpState, Linker } from '@sgrud/utils';
import { filter } from 'rxjs';

describe('@sgrud/utils/http/state', () => {

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

  describe('firing a request', () => {
    const test = jest.fn((next) => {
      switch (test.mock.calls.length) {
        case 1: expect(next.type).toBe('download_progress'); break;
        case 2: expect(next.type).toBe('upload_progress'); break;
        case 3: expect(next.type).toBe('download_load'); break;
      }
    });

    it('does not consume the progress events', (done) => {
      const subscription = new HttpClient().handle({
        includeDownloadProgress: true,
        includeUploadProgress: true,
        method: 'GET',
        url: 'url'
      }).subscribe(test);

      setTimeout(() => {
        xhrMock.addEventListener.mock.calls.find(([call]) => {
          return call === 'progress';
        })[1]({ type: 'progress' });

        setTimeout(() => {
          xhrMock.upload.addEventListener.mock.calls.find(([call]) => {
            return call === 'progress';
          })[1]({ type: 'progress' });

          setTimeout(() => {
            xhrMock.addEventListener.mock.calls.find(([call]) => {
              return call === 'load';
            })[1]({ type: 'load' });
          });
        });
      });

      subscription.add(done);
    });
  });

  describe('firing a request', () => {
    const state = new Linker().get(HttpState) as HttpState;
    const test = jest.fn(([next]) => {
      switch (test.mock.calls.length) {
        case 1: expect(next.type).toBe('download_progress'); break;
        case 2: expect(next.type).toBe('download_load'); break;
      }
    });

    it('makes the request state observable', (done) => {
      const subscription = state.requests.pipe(
        filter((next) => Boolean(next.length))
      ).subscribe(test);

      setTimeout(() => {
        xhrMock.addEventListener.mock.calls.find(([call]) => {
          return call === 'progress';
        })[1]({ type: 'progress' });

        setTimeout(() => {
          xhrMock.addEventListener.mock.calls.find(([call]) => {
            return call === 'load';
          })[1]({ type: 'load' });
        });
      });

      HttpClient.get('url').subscribe(() => {
        expect(test).toHaveBeenCalledTimes(2);
        subscription.unsubscribe();
      });

      subscription.add(done);
    });
  });

});
