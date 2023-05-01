import { Component, createElement, customElements, Reference } from '@sgrud/shell';

describe('@sgrud/shell/component/reference', () => {

  /*
   * Variables
   */

  class Element extends HTMLElement {

    @Reference('unknown', ['change'])
    public unknown?: HTMLDivElement;

  }

  customElements.define('element-tag', Element);

  @Component('element-one')
  class ElementOne extends HTMLElement implements Component {

    @Reference('key')
    public reference?: HTMLDivElement;

    @Reference('unknown')
    public unknown?: HTMLDivElement;

    public readonly template: JSX.Element = createElement('div', {
      key: 'key'
    });

  }

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {

    @Reference('key', ['change'])
    public reference?: HTMLDivElement;

    @Reference('unknown', ['change'])
    public unknown?: HTMLDivElement;

    public readonly template: JSX.Element = createElement('div', {
      key: 'key'
    });

  }

  /*
   * Unittests
   */

  describe('binding a property on a component without template', () => {
    it('returns undefined as no template exists', () => {
      document.body.innerHTML = '<element-tag></element-tag>';
      const element = document.querySelector<Element>('element-tag')!;

      expect(element.unknown).toBeUndefined();
    });
  });

  describe('binding a property to a template reference', () => {
    it('mirrors the referenced template element to the bound property', () => {
      document.body.innerHTML = '<element-one></element-one>';
      const elementOne = document.querySelector<ElementOne>('element-one')!;

      expect(elementOne.reference).toBeInstanceOf(HTMLDivElement);
      expect(elementOne.unknown).toBeUndefined();
    });
  });

  describe('observing events of a bound template reference', () => {
    it('invokes the appropriate callback', () => {
      document.body.innerHTML = '<element-two></element-two>';
      const elementTwo = document.querySelector<ElementTwo>('element-two')!;
      const spy = jest.spyOn(elementTwo, 'referenceChangedCallback' as any);

      const event = new Event('change');
      elementTwo.reference!.dispatchEvent(event);

      expect(spy).toBeCalledWith('key', elementTwo.reference, event);
      expect(elementTwo.reference).toBeInstanceOf(HTMLDivElement);
      expect(elementTwo.unknown).toBeUndefined();
    });
  });

});
