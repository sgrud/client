import { customElements } from '@sgrud/shell';

describe('@sgrud/shell/component/registry', () => {

  class ClassOne extends HTMLElement { }
  class ClassTwo extends HTMLElement { }

  customElements.define('class-one', ClassOne);
  globalThis.customElements.define('class-two', ClassTwo);

  describe('registering a custom component with the proxied registry', () => {
    it('registers the custom component with the native registry', () => {
      expect(customElements.get('class-one')).toBe(ClassOne);
    });
  });

  describe('getting the name of a registered custom component', () => {
    it('returns the name of the custom component', () => {
      expect(customElements.getName(ClassOne)).toBe('class-one');
    });
  });

  describe('getting the name of a natively registered custom component', () => {
    it('returns the name of the custom component', () => {
      expect(customElements.getName(ClassTwo)).toBe('class-two');
    });
  });

  describe('getting the name of a unknown custom component', () => {
    const unknown = class extends HTMLElement { };

    it('returns undefined', () => {
      expect(customElements.getName(unknown)).toBeUndefined();
    });
  });

});
