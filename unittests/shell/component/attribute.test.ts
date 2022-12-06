globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

import { Attribute, customElements } from '@sgrud/shell';

describe('@sgrud/shell/component/attribute', () => {

  class Element extends HTMLElement {
    @Attribute() public attribute?: string;
    @Attribute('data-attr') public data?: string;
    @Attribute() public preset?: string = null!;
    @Attribute() public unused?: undefined;
  }

  customElements.define('element-tag', Element);
  document.body.innerHTML = '<element-tag preset="value"></element-tag>';

  describe('binding a property to an attribute', () => {
    const testClass = document.querySelector('element-tag') as Element;
    testClass.attribute = 'value';

    it('mirrors the bound property to the attribute', () => {
      expect(testClass.attribute).toBe(testClass.getAttribute('attribute'));
      expect(testClass.attribute).not.toBeNull();
    });
  });

  describe('binding a property to a data attribute', () => {
    const testClass = document.querySelector('element-tag') as Element;
    testClass.data = 'value';

    it('mirrors the bound property to the dataset', () => {
      expect(testClass.dataset.attr).toBe(testClass.getAttribute('data-attr'));
      expect(testClass.dataset.attr).not.toBeUndefined();
    });
  });

  describe('initializing a bound property in the constructor and dom', () => {
    const testClass = document.querySelector('element-tag') as Element;

    it('prefers the value passed to the attribute through the dom', () => {
      expect(testClass.preset).toBe(testClass.getAttribute('preset'));
      expect(testClass.preset).not.toBeUndefined();
    });
  });

  describe('retrieving a bound property when no attribute is present', () => {
    const testClass = document.querySelector('element-tag') as Element;

    it('returns undefined', () => {
      expect(testClass.unused).toBeUndefined();
    });
  });

});
