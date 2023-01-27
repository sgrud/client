import { HttpClient, HttpHandler, HttpProxy, Linker, Target } from '@sgrud/core';
import { map, Observable, of } from 'rxjs';
import { AjaxConfig as Request, AjaxResponse as Response } from 'rxjs/ajax';

describe('@sgrud/core/http/proxy', () => {

  new Linker<typeof HttpProxy>().clear();

  @Target<typeof ProxyOne>()
  class ProxyOne extends HttpProxy {
    public override proxy<T>(
      request: Request,
      handler: HttpHandler
    ): Observable<Response<T>> {
      if (request.url === 'one') {
        return of({ response: request.url } as Response<T>);
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
    public override proxy<T>(request: Request): Observable<Response<T>> {
      return of({ response: request.headers!.next } as Response<T>);
    }
  }

  describe('targeting HttpProxy subclasses', () => {
    const linker = new Linker<typeof HttpProxy>();
    const links = linker.getAll(HttpProxy);

    it('appends the targets to the proxy chain', () => {
      expect(links).toContain(linker.get(ProxyOne));
      expect(links).toContain(linker.get(ProxyTwo));
    });
  });

  describe('firing a request', () => {
    const request = HttpClient.get('one');

    it('intercepts the request with the proxy', (done) => {
      request.subscribe((response) => {
        expect(response.response).toBe('one');
        done();
      });
    });
  });

  describe('firing a request', () => {
    const request = HttpClient.get('two');

    it('intercepts the request with the proxy chain', (done) => {
      request.subscribe((response) => {
        expect(response.responseHeaders.prev).toBe('one');
        expect(response.response).toBe('two');
        done();
      });
    });
  });

});
