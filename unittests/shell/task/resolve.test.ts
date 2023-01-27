globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

import { Component, customElements, Resolve, Router } from '@sgrud/shell';
import { of } from 'rxjs';

declare global {
  interface HTMLElementTagNameMap {
    'element-tag': HTMLElement;
    'element-one': HTMLElement;
    'element-two': HTMLElement;
  }
}

describe('@sgrud/shell/task/resolve', () => {

  class Element extends HTMLElement { }

  class ElementOne extends HTMLElement {
    @Resolve((segment) => of(segment)) public readonly segment!: Router.Segment;
    @Resolve((_, state) => of(state)) public readonly state!: Router.State;
  }

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {
    @Resolve((segment) => of(segment)) public readonly segment!: Router.Segment;
    @Resolve((_, state) => of(state)) public readonly state!: Router.State;
  }

  customElements.define('element-tag', Element);
  customElements.define('element-one', ElementOne);

  new Router().add({
    path: '',
    component: 'element-tag',
    children: [
      {
        path: 'one',
        component: 'element-one'
      },
      {
        path: 'two',
        component: 'element-two'
      }
    ]
  });

  describe('resolving a property of a plain custom component', () => {
    const router = new Router();

    it('replaces the property value with the resolved task', (done) => {
      router.navigate('one').subscribe((value) => {
        const elementOne = document.querySelector('element-one') as ElementOne;

        expect(elementOne).toBeInstanceOf(ElementOne);
        expect(elementOne.segment).toBe(value.segment.child);
        expect(elementOne.state).toBe(value);
        done();
      });
    });
  });

  describe('resolving a property of a custom element', () => {
    const router = new Router();

    it('replaces the property value with the resolved task', (done) => {
      router.navigate('two').subscribe((value) => {
        const elementTwo = document.querySelector('element-two') as ElementTwo;

        expect(elementTwo).toBeInstanceOf(ElementTwo);
        expect(elementTwo.segment).toBe(value.segment.child);
        expect(elementTwo.state).toBe(value);
        done();
      });
    });
  });

});
