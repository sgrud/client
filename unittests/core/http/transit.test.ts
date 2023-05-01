import { Http, Transit } from '@sgrud/core';
import { randomBytes } from 'crypto';
import express from 'express';
import { Server } from 'http';
import { from, map } from 'rxjs';

describe('@sgrud/core/http/transit', () => {

  /*
   * Fixtures
   */

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/', (_, r) => r.send(randomBytes(1024)))
    .listen(location.port));

  /*
   * Unittests
   */

  describe('constructing an instance', () => {
    const transit = new Transit();

    it('returns the singleton instance', () => {
      expect(transit).toBe(new Transit());
    });
  });

  describe('firing a request', () => {
    const request = Http.request({
      body: randomBytes(1024),
      includeDownloadProgress: true,
      includeUploadProgress: true,
      method: 'POST',
      url: '/path'
    });

    it('does not consume the progress events', (done) => {
      request.pipe(map((next, index) => {
        switch (index) {
          case 0: expect(next.type).toBe('download_loadstart'); break;
          case 1: expect(next.type).toBe('upload_loadstart'); break;
          case 2: expect(next.type).toBe('upload_progress'); break;
          case 3: expect(next.type).toBe('upload_load'); break;
          case 4: expect(next.type).toBe('download_progress'); break;
          case 5: expect(next.type).toBe('download_load'); break;
        }
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('firing a request', () => {
    const transit = new Transit();
    const request = Http.get('/path');

    it('makes the requests in transit observable', (done) => {
      const changes = from(transit).pipe(map(([next], index) => {
        switch (index) {
          case 0: expect(next.type).toBe('download_loadstart'); break;
          case 1: expect(next.type).toBe('download_progress'); break;
          case 2: expect(next.type).toBe('download_load'); break;
        }
      })).subscribe({
        error: done
      });

      request.pipe(map(() => {
        changes.unsubscribe();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
