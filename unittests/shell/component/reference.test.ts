globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

import { Component, customElements, Reference } from '@sgrud/shell';
import { jsx } from '@sgrud/shell/jsx-runtime';

declare global {
  interface HTMLElementTagNameMap {
    'element-one': HTMLElement;
    'element-two': HTMLElement;
  }
}

describe('@sgrud/shell/component/reference', () => {

  class Element extends HTMLElement {
    @Reference('unused', ['change']) public unused?: HTMLDivElement;
  }

  @Component('element-one')
  class ElementOne extends HTMLElement implements Component {
    @Reference('key') public reference!: HTMLDivElement;
    @Reference('unused') public unused?: HTMLDivElement;
    public readonly template: JSX.Element = jsx('div', { key: 'key' });
  }

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {
    @Reference('key', ['change']) public reference!: HTMLDivElement;
    @Reference('unused', ['change']) public unused?: HTMLDivElement;
    public readonly template: JSX.Element = jsx('div', { key: 'key' });
  }

  customElements.define('element-tag', Element);

  describe('binding a property on a component without template', () => {
    it('returns undefined as no template exists', () => {
      document.body.innerHTML = '<element-tag></element-tag>';

      const classOne = document.querySelector('element-tag') as Element;
      expect(classOne.unused).toBeUndefined();
    });
  });

  describe('binding a property to a template reference', () => {
    it('mirrors the referenced template element to the bound property', () => {
      document.body.innerHTML = '<element-one></element-one>';
      const classOne = document.querySelector('element-one') as ElementOne;

      expect(classOne.reference).toBeInstanceOf(HTMLDivElement);
      expect(classOne.unused).toBeUndefined();
    });
  });

  describe('observing events of a bound template reference', () => {
    it('invokes the referenceChangedCallback', () => {
      document.body.innerHTML = '<element-two></element-two>';
      const classTwo = document.querySelector('element-two') as ElementTwo;
      const spy = jest.spyOn(classTwo as Component, 'referenceChangedCallback');

      const event = new Event('change');
      classTwo.reference.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith('key', classTwo.reference, event);
      expect(classTwo.reference).toBeInstanceOf(HTMLDivElement);
      expect(classTwo.unused).toBeUndefined();
    });
  });

});
