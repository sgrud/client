globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

import { Component, Reference } from '@sgrud/shell';
import { jsx } from '@sgrud/shell/jsx-runtime';

declare global {
  interface HTMLElementTagNameMap {
    'class-one': HTMLElement;
    'class-two': HTMLElement;
  }
}

describe('@sgrud/shell/component/reference', () => {

  class TestClass extends HTMLElement implements Component {
    @Reference('unused', ['change']) public unused?: HTMLDivElement;
  }

  @Component('class-one')
  class ClassOne extends HTMLElement implements Component {
    @Reference('key') public reference?: HTMLDivElement;
    @Reference('unused') public unused?: HTMLDivElement;
    public readonly template: JSX.Element = jsx('div', { key: 'key' });
  }

  @Component('class-two')
  class ClassTwo extends HTMLElement implements Component {
    @Reference('key', ['change']) public reference?: HTMLDivElement;
    @Reference('unused', ['change']) public unused?: HTMLDivElement;
    public readonly template: JSX.Element = jsx('div', { key: 'key' });
  }

  describe('binding a property on a component without template', () => {
    customElements.define('test-class', TestClass);
    document.body.innerHTML = '<test-class></test-class>';
    const classOne = document.body.firstChild as TestClass;

    it('returns undefined as no template exists', () => {
      expect(classOne.unused).toBeUndefined();
    });
  });

  describe('binding a property to a template reference', () => {
    document.body.innerHTML = '<class-one></class-one>';
    const classOne = document.body.firstChild as ClassOne;

    it('mirrors the referenced template element to the bound property', () => {
      expect(classOne.reference).toBeInstanceOf(HTMLDivElement);
      expect(classOne.unused).toBeUndefined();
    });
  });

  describe('observing events of a bound template reference', () => {
    document.body.innerHTML = '<class-two></class-two>';
    const classTwo = document.body.firstChild as ClassTwo;
    const spy = jest.spyOn(classTwo as Component, 'referenceChangedCallback');

    const event = new Event('change');
    classTwo.reference!.dispatchEvent(event);

    it('invokes the referenceChangedCallback', () => {
      expect(spy).toHaveBeenCalledWith('key', classTwo.reference, event);
      expect(classTwo.reference).toBeInstanceOf(HTMLDivElement);
      expect(classTwo.unused).toBeUndefined();
    });
  });

});
