import { HttpClient, HttpState } from '@sgrud/core';
import { randomBytes } from 'crypto';
import express from 'express';
import { Server } from 'http';
import { filter, from } from 'rxjs';

describe('@sgrud/core/http/state', () => {

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/', (_, r) => r.send(randomBytes(1024)))
    .listen(location.port));

  describe('instantiating a linker', () => {
    const httpState = new HttpState();

    it('returns the singleton linker', () => {
      expect(httpState).toBe(new HttpState());
    });
  });

  describe('firing a request', () => {
    const test = jest.fn((value) => {
      switch (test.mock.calls.length) {
        case 1: expect(value.type).toBe('download_loadstart'); break;
        case 2: expect(value.type).toBe('upload_loadstart'); break;
        case 3: expect(value.type).toBe('upload_progress'); break;
        case 4: expect(value.type).toBe('upload_load'); break;
        case 5: expect(value.type).toBe('download_progress'); break;
        case 6: expect(value.type).toBe('download_load'); return true;
      }

      return false;
    });

    it('does not consume the progress events', (done) => {
      HttpClient.prototype.handle({
        body: randomBytes(1024),
        includeDownloadProgress: true,
        includeUploadProgress: true,
        method: 'POST',
        url: '/api'
      }).pipe(filter(test)).subscribe(() => {
        expect(test).toHaveBeenCalledTimes(6);
        done();
      });
    });
  });

  describe('firing a request', () => {
    const httpState = new HttpState();

    const test = jest.fn(([value]) => {
      switch (test.mock.calls.length) {
        case 1: expect(value.type).toBe('download_loadstart'); break;
        case 2: expect(value.type).toBe('download_progress'); break;
        case 3: expect(value.type).toBe('download_load'); break;
      }
    });

    it('makes the request state observable', (done) => {
      const subscription = from(httpState).pipe(
        filter((value) => Boolean(value.length))
      ).subscribe(test);

      HttpClient.get('/api').subscribe(() => {
        expect(test).toHaveBeenCalledTimes(3);
        subscription.unsubscribe();
      });

      subscription.add(done);
    });
  });

});
