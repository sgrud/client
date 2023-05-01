import { Mutable } from '@sgrud/core';
import { Component, customElements, Resolve, Router } from '@sgrud/shell';
import { map, of } from 'rxjs';

describe('@sgrud/shell/queue/resolve', () => {

  /*
   * Variables
   */

  class Element extends HTMLElement {}

  customElements.define('element-tag', Element);

  class ElementOne extends HTMLElement {

    @Resolve((segment) => of(segment))
    public readonly segment!: Router.Segment;

    @Resolve((_, state) => of(state))
    public readonly state!: Router.State;

  }

  customElements.define('element-one', ElementOne);

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {

    @Resolve((segment) => of(segment))
    public readonly segment!: Router.Segment;

    @Resolve((_, state) => of(state))
    public readonly state!: Router.State;

  }

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
    ],
    slots: {
      unknown: 'unknown-element'
    }
  });

  /*
   * Unittests
   */

  describe('resolving a property of a plain custom component', () => {
    const navigate = new Router().navigate('one');

    it('replaces the property value with the resolved reference', (done) => {
      navigate.pipe(map((next) => {
        const elementOne = document.querySelector<ElementOne>('element-one')!;
        (elementOne as Mutable<ElementTwo>).state = undefined!;

        expect(elementOne).toBeInstanceOf(ElementOne);
        expect(elementOne.segment).toBe(next.segment.child);
        expect(elementOne.state).toBeUndefined();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('resolving a property of a custom element', () => {
    const navigate = new Router().navigate('two');

    it('replaces the property value with the resolved reference', (done) => {
      navigate.pipe(map((next) => {
        const elementTwo = document.querySelector<ElementTwo>('element-two')!;
        (elementTwo as Mutable<ElementTwo>).state = undefined!;

        expect(elementTwo).toBeInstanceOf(ElementTwo);
        expect(elementTwo.segment).toBe(next.segment.child);
        expect(elementTwo.state).toBeUndefined();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
