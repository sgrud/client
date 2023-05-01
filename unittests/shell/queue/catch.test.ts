import { Mutable } from '@sgrud/core';
import { Catch, Component, customElements, Resolve, Router } from '@sgrud/shell';
import { catchError, map, of } from 'rxjs';

describe('@sgrud/shell/queue/catch', () => {

  /*
   * Variables
   */

  class Element extends HTMLElement {

    @Catch((e) => !(e instanceof URIError))
    public readonly error: any;

    @Catch((e) => e instanceof URIError)
    public readonly uriError: any;

  }

  customElements.define('element-tag', Element);

  @Component('element-one')
  class ElementOne extends HTMLElement implements Component {

    @Catch((e) => e instanceof EvalError)
    public readonly evalError: any;

    @Resolve((segment) => of(segment))
    public readonly segment!: Router.Segment;

    public connectedCallback(): void {
      if (!this.segment.child) {
        globalThis.dispatchEvent(Object.assign(new Event('error'), {
          error: new TypeError()
        }));
      }
    }

  }

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {

    public connectedCallback(): void {
      globalThis.dispatchEvent(Object.assign(new Event('unhandledrejection'), {
        reason: new EvalError()
      }));
    }

  }

  new Router().add({
    path: '',
    children: [
      {
        path: 'error',
        component: 'element-tag'
      },
      {
        path: 'global',
        component: 'element-one'
      },
      {
        path: 'local',
        component: 'element-one',
        children: [
          {
            path: 'child',
            component: 'element-two'
          }
        ]
      }
    ],
    slots: {
      unknown: 'unknown-element'
    }
  });

  /*
   * Unittests
   */

  describe('navigating to an unknown path', () => {
    const navigate = new Router().navigate('unknown');

    it('redirects to the correct error handling route', (done) => {
      navigate.pipe(map((next) =>{
        const element = document.querySelector<Element>('element-tag')!;
        (element as Mutable<Element>).error = undefined;

        expect(next.path).toBe('error');
        expect(element.uriError).toBeInstanceOf(URIError);
        expect(element.uriError.message).toBe('/unknown');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('navigating to a path throwing an error', () => {
    const navigate = new Router().navigate('global');

    it('redirects to the correct error handling route', (done) => {
      navigate.pipe(map((next) => {
        const element = document.querySelector<Element>('element-tag')!;

        expect(next.path).toBe('error');
        expect(element.error).toBeInstanceOf(TypeError);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('navigating to a child path throwing an error', () => {
    const navigate = new Router().navigate('local/child');

    it('redirects to the correct local error handling route', (done) => {
      navigate.pipe(map((next) => {
        const elementOne = document.querySelector<ElementOne>('element-one')!;
        const elementTwo = document.querySelector<ElementTwo>('element-two')!;

        expect(next.path).toBe('local');
        expect(elementOne.evalError).toBeInstanceOf(EvalError);
        expect(elementTwo).toBeNull();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('navigating to an unknown path without error handler', () => {
    const router = new Router();
    const navigate = router.navigate('unknown').pipe(
      catchError((error) => of(error))
    );

    it('throws the error through the navigation observable', (done) => {
      const spy = jest.spyOn(globalThis, 'window', 'get');
      spy.mockImplementation(() => undefined!);
      router.clear();

      navigate.pipe(map((next) => {
        expect(spy).toBeCalled();
        expect(next).toBeInstanceOf(URIError);
        expect(next.message).toBe('/unknown');
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
