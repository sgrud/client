import { HttpClient, HttpHandler, HttpProxy, Linker, Target } from '@sgrud/core';
import { map, Observable, of } from 'rxjs';
import { AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';

describe('@sgrud/core/http/proxy', () => {

  @Target<typeof ProxyOne>()
  class ProxyOne extends HttpProxy {
    public override proxy<T>(
      request: Request,
      handler: HttpHandler
    ): Observable<Response<T>> {
      if (request.url === 'one') {
        return of({
          response: request.url as unknown as T
        } as Response<T>);
      }

      return handler.handle<T>({
        ...request, headers: { next: request.url }
      }).pipe(map((response) => ({
        ...response, responseHeaders: { prev: 'one' }
      })));
    }
  }

  @Target<typeof ProxyTwo>()
  class ProxyTwo extends HttpProxy {
    public override proxy<T>(
      request: Request
    ): Observable<Response<T>> {
      return of({
        response: request.headers!.next
      } as Response<T>);
    }
  }

  describe('targeting HttpProxy subclasses', () => {
    const linker = new Linker<typeof HttpProxy>();
    const proxies = linker.getAll(HttpProxy);

    it('appends the targets to the proxy chain', () => {
      expect(proxies).toContain(linker.get(ProxyOne));
      expect(proxies).toContain(linker.get(ProxyTwo));
    });
  });

  describe('firing a request', () => {
    const request = HttpClient.get('one');

    it('intercepts the request with the proxy', (done) => {
      const subscription = request.subscribe((response) => {
        expect(response.response).toBe('one');
      });

      subscription.add(done);
    });
  });

  describe('firing a request', () => {
    const request = HttpClient.get('two');

    it('intercepts the request with the proxy chain', (done) => {
      const subscription = request.subscribe((response) => {
        expect(response.request.headers.next).toBe('two');
        expect(response.responseHeaders.prev).toBe('one');
        expect(response.response).toBe('two');
      });

      subscription.add(done);
    });
  });

});
