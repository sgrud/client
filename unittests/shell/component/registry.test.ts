import { customElements } from '@sgrud/shell';

describe('@sgrud/shell/component/registry', () => {

  class ElementOne extends HTMLElement { }
  class ElementTwo extends HTMLElement { }

  customElements.define('element-one', ElementOne);
  globalThis.customElements.define('element-two', ElementTwo);

  describe('registering a custom component with the proxied registry', () => {
    it('registers the custom component with the native registry', () => {
      expect(customElements.get('element-one')).toBe(ElementOne);
    });
  });

  describe('getting the name of a registered custom component', () => {
    it('returns the name of the custom component', () => {
      expect(customElements.getName(ElementOne)).toBe('element-one');
    });
  });

  describe('getting the name of a natively registered custom component', () => {
    it('returns the name of the custom component', () => {
      expect(customElements.getName(ElementTwo)).toBe('element-two');
    });
  });

  describe('getting the name of a unknown custom component', () => {
    const unknown = class extends HTMLElement { };

    it('returns undefined', () => {
      expect(customElements.getName(unknown)).toBeUndefined();
    });
  });

});
