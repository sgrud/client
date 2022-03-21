import { Attribute } from '@sgrud/shell';

globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

describe('@sgrud/shell/component/attribute', () => {

  class TestClass extends HTMLElement {
    @Attribute() public attribute?: string;
    @Attribute('data-attr') public data?: string;
    @Attribute() public preset?: string = undefined;
  }

  customElements.define('test-class', TestClass);
  document.body.innerHTML = '<test-class preset="value"></test-class>';

  describe('binding a property to an attribute', () => {
    const testClass = document.body.firstChild as TestClass;
    testClass.attribute = 'value';

    it('mirrors the bound property to the attribute', () => {
      expect(testClass.attribute).toBe(testClass.getAttribute('attribute'));
    });
  });

  describe('binding a property to a data attribute', () => {
    const testClass = document.body.firstChild as TestClass;
    testClass.data = 'value';

    it('mirrors the bound property to the dataset', () => {
      expect(testClass.dataset.attr).toBe(testClass.getAttribute('data-attr'));
    });
  });

  describe('initializing a bound property in the constructor and dom', () => {
    const testClass = document.body.firstChild as TestClass;

    it('prefers the value passed to the attribute through the dom', () => {
      expect(testClass.preset).toBe(testClass.getAttribute('preset'));
      expect(testClass.preset).not.toBeUndefined();
    });
  });

});
