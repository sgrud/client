globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

import { Catch, Component, customElements, Resolve, Router } from '@sgrud/shell';
import { catchError, of } from 'rxjs';

declare global {
  interface HTMLElementTagNameMap {
    'element-tag': HTMLElement;
    'element-one': HTMLElement;
    'element-two': HTMLElement;
  }
}

describe('@sgrud/shell/task/catch', () => {

  class Element extends HTMLElement {
    @Catch((e) => !(e instanceof URIError)) public readonly error: any;
    @Catch((e) => e instanceof URIError) public readonly uriError: any;
  }

  @Component('element-one')
  class ElementOne extends HTMLElement implements Component {
    @Catch((e) => e instanceof EvalError) public readonly evalError: any;
    @Resolve((segment) => of(segment)) public readonly segment!: Router.Segment;

    public connectedCallback(): void {
      if (!this.segment.child) {
        window.dispatchEvent(Object.assign(new Event('error'), {
          error: new TypeError()
        }));
      }
    }
  }

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {
    public connectedCallback(): void {
      window.dispatchEvent(Object.assign(new Event('unhandledrejection'), {
        reason: new EvalError()
      }));
    }
  }

  customElements.define('element-tag', Element);

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
    ]
  });

  describe('navigating to an unknown path', () => {
    const router = new Router();

    it('redirects to the correct error handling route', (done) => {
      router.navigate('unknown').subscribe((value) => {
        const element = document.querySelector('element-tag') as Element;

        expect(value.path).toBe('error');
        expect(element.uriError).toBeInstanceOf(URIError);
        expect(element.uriError.message).toBe('/unknown');
        done();
      });
    });
  });

  describe('navigating to a path throwing an error', () => {
    const router = new Router();

    it('redirects to the correct error handling route', (done) => {
      router.navigate('global').subscribe((value) => {
        const element = document.querySelector('element-tag') as Element;

        expect(value.path).toBe('error');
        expect(element.error).toBeInstanceOf(TypeError);
        done();
      });
    });
  });

  describe('navigating to a child path throwing an error', () => {
    const router = new Router();

    it('redirects to the correct local error handling route', (done) => {
      router.navigate('local/child').subscribe((value) => {
        const elementOne = document.querySelector('element-one') as ElementOne;
        const elementTwo = document.querySelector('element-two') as ElementTwo;

        expect(value.path).toBe('local');
        expect(elementOne.evalError).toBeInstanceOf(EvalError);
        expect(elementTwo).toBeNull();
        done();
      });
    });
  });

  describe('navigating to an unknown path without error handler', () => {
    const router = new Router();

    it('throws the error through the navigation observable', (done) => {
      delete (globalThis as Partial<typeof globalThis>).window;
      router.clear();

      router.navigate('unknown').pipe(
        catchError((error) => of(error))
      ).subscribe((error) => {
        expect(error).toBeInstanceOf(URIError);
        expect(error.message).toBe('/unknown');
        done();
      });
    });
  });

});
