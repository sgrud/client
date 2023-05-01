import { Attribute, customElements } from '@sgrud/shell';

describe('@sgrud/shell/component/attribute', () => {

  /*
   * Fixtures
   */

  document.body.innerHTML = '<element-tag preset="default"></element-tag>';

  /*
   * Variables
   */

  class Element extends HTMLElement {

    @Attribute()
    public attribute?: string;

    @Attribute('data-attr')
    public data?: string;

    @Attribute()
    public preset?: string = 'value';

    @Attribute()
    public unknown?: undefined;

  }

  customElements.define('element-tag', Element);

  /*
   * Unittests
   */

  describe('binding a property to an attribute', () => {
    const element = document.querySelector<Element>('element-tag')!;

    it('mirrors the bound property to the attribute', () => {
      element.attribute = 'value';

      expect(element.attribute).toBe(element.getAttribute('attribute'));
    });
  });

  describe('binding a property to a data attribute', () => {
    const element = document.querySelector<Element>('element-tag')!;

    it('mirrors the bound property to the dataset', () => {
      element.data = 'value';

      expect(element.dataset.attr).toBe(element.getAttribute('data-attr'));
    });
  });

  describe('initializing a bound property in the constructor and dom', () => {
    const element = document.querySelector<Element>('element-tag')!;

    it('prefers the value passed to the attribute through the dom', () => {
      expect(element.preset).toBe(element.getAttribute('preset'));
    });
  });

  describe('retrieving a bound property when no attribute is present', () => {
    const element = document.querySelector<Element>('element-tag')!;

    it('returns undefined', () => {
      expect(element.unknown).toBeUndefined();
    });
  });

});
