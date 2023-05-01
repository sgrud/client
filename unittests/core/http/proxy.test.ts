import { Http, Linker, Proxy, Target } from '@sgrud/core';
import { Observable, map, of } from 'rxjs';

describe('@sgrud/core/http/proxy', () => {

  /*
   * Fixtures
   */

  new Linker().clear();

  /*
   * Variables
   */

  @Target()
  class ProxyOne extends Proxy {

    public override handle<T>(
      request: Http.Request,
      handler: Http.Handler
    ): Observable<Http.Response<T>> {
      if (request.url !== 'one') {
        return handler.handle(Object.assign(request, {
          headers: {
            next: request.url
          }
        })).pipe(map((response) => Object.assign(response, {
          responseHeaders: {
            prev: 'one'
          }
        })));
      }

      return of({
        response: request.url
      } as Http.Response<T>);
    }

  }

  @Target()
  class ProxyTwo extends Proxy {

    public override handle<T>(
      request: Http.Request
    ): Observable<Http.Response<T>> {
      return of({
        response: request.headers!.next
      } as Http.Response<T>);
    }

  }

  /*
   * Unittests
   */

  describe('targeting proxy subclasses', () => {
    const linker = new Linker();
    const links = linker.getAll(Proxy);

    it('appends the targets to the proxy chain', () => {
      expect(links).toContain(linker.get(ProxyOne));
      expect(links).toContain(linker.get(ProxyTwo));
    });
  });

  describe('firing a request', () => {
    const request = Http.get('one');

    it('intercepts the request with the proxy', (done) => {
      request.pipe(map((next) => {
        expect(next.response).toBe('one');
        expect(next.responseHeaders).toBeUndefined();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('firing a request', () => {
    const request = Http.get('two');

    it('intercepts the request with the proxy chain', (done) => {
      request.pipe(map((next) => {
        expect(next.response).toBe('two');
        expect(next.responseHeaders).toStrictEqual({ prev: 'one' });
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
