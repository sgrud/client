import { HttpClient, HttpHandler, HttpProxy, Linker, Target } from '@sgrud/utils';
import { map, Observable, of } from 'rxjs';
import { AjaxConfig, AjaxResponse } from 'rxjs/ajax';

describe('@sgrud/utils/http/proxy', () => {

  @Target()
  class ProxyOne extends HttpProxy {
    public override proxy<T>(
      request: AjaxConfig,
      handler: HttpHandler
    ): Observable<AjaxResponse<T>> {
      if (request.url === 'one') {
        return of({
          response: request.url as unknown as T
        } as AjaxResponse<T>);
      }

      return handler.handle<T>({
        ...request, headers: { next: request.url }
      }).pipe(map((response) => ({
        ...response, responseHeaders: { prev: 'one' }
      })));
    }
  }

  @Target()
  class ProxyTwo extends HttpProxy {
    public override proxy<T>(
      request: AjaxConfig
    ): Observable<AjaxResponse<T>> {
      return of({
        response: request.headers?.next as unknown as T
      } as AjaxResponse<T>);
    }
  }

  describe('targeting HttpProxy subclasses', () => {
    const linker = new Linker();
    const proxies = linker.getAll(HttpProxy as Target<HttpProxy>);

    it('appends to the proxy chain', () => {
      expect(proxies).toContain(linker.get(ProxyOne));
      expect(proxies).toContain(linker.get(ProxyTwo));
    });
  });

  describe('firing a request', () => {
    const request = HttpClient.get('one');

    it('intercepts it with the proxy', (done) => {
      const one = request.subscribe((response) => {
        expect(response.response).toBe('one');
      });

      one.add(done);
    });
  });

  describe('firing a request', () => {
    const request = HttpClient.get('two');

    it('intercepts it with the proxy chain', (done) => {
      const two = request.subscribe((response) => {
        expect(response.responseHeaders.prev).toBe('one');
        expect(response.response).toBe('two');
      });

      two.add(done);
    });
  });

});
