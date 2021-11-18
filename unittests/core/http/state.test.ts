import xhr from '.mocks/xhr.mock';
import { HttpClient, HttpState } from '@sgrud/core';
import { filter, from } from 'rxjs';

describe('@sgrud/core/http/state', () => {

  describe('instantiating a linker', () => {
    const httpState = new HttpState();

    it('returns the singleton linker', () => {
      expect(httpState).toBe(new HttpState());
    });
  });

  describe('firing a request', () => {
    const test = jest.fn((next) => {
      switch (test.mock.calls.length) {
        case 1: expect(next.type).toBe('download_progress'); break;
        case 2: expect(next.type).toBe('upload_progress'); break;
        case 3: expect(next.type).toBe('download_load'); break;
      }
    });

    it('does not consume the progress events', (done) => {
      const subscription = HttpClient.prototype.handle({
        includeDownloadProgress: true,
        includeUploadProgress: true,
        method: 'GET',
        url: 'url'
      }).subscribe(test);

      subscription.add(done);

      xhr.trigger('progress');
      xhr.trigger('progress', null, true);
      xhr.trigger('load');
    });
  });

  describe('firing a request', () => {
    const httpState = new HttpState();
    const test = jest.fn(([next]) => {
      switch (test.mock.calls.length) {
        case 1: expect(next.type).toBe('download_progress'); break;
        case 2: expect(next.type).toBe('download_load'); break;
      }
    });

    it('makes the request state observable', (done) => {
      const subscription = from(httpState).pipe(
        filter((next) => Boolean(next.length))
      ).subscribe(test);

      HttpClient.get('url').subscribe(() => {
        expect(test).toHaveBeenCalledTimes(2);
        subscription.unsubscribe();
      });

      subscription.add(done);

      xhr.trigger('progress');
      xhr.trigger('load');
    });
  });

});
