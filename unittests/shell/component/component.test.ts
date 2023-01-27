globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

import { Attribute, Component, Reference, render } from '@sgrud/shell';
import { jsxs } from '@sgrud/shell/jsx-runtime';

declare global {
  interface HTMLElementTagNameMap {
    'element-one': HTMLElement;
    'element-two': HTMLElement;
    'main-element': HTMLElement;
  }
}

describe('@sgrud/shell/component/component', () => {

  @Component('element-one')
  class ElementOne extends HTMLElement implements Component {
    public constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  }

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {
    @Attribute() public attribute?: string;
    @Reference('key', ['change']) public reference!: HTMLDivElement;
    public readonly styles: string[] = [':host { color: green; }'];
    public readonly template: JSX.Element = jsxs('div', { key: 'key' });
  }

  @Component('main-element', 'main')
  class MainElement extends HTMLElement implements Component {
    @Attribute() public attribute?: string;
    @Reference('key', ['change']) public reference!: HTMLDivElement;
    public readonly template: JSX.Element = jsxs('div', { key: 'key' });
    public connectedCallback(): void {
      this.renderComponent();
    }
    public adoptedCallback(): void {
      this.renderComponent();
    }
    public attributeChangedCallback(): void {
      this.renderComponent();
    }
    public referenceChangedCallback(): void {
      this.renderComponent();
    }
    public renderComponent(): void {
      render(this.shadowRoot!, this.template);
    }
  }

  describe('declaring a component without styles and template', () => {
    it('renders a slot element', () => {
      document.body.innerHTML = '<element-one></element-one>';
      const classOne = document.querySelector('element-one') as ElementOne;

      expect(classOne).toBeInstanceOf(ElementOne);
      expect(classOne.shadowRoot?.innerHTML).toBe('<slot></slot>');
    });
  });

  describe('declaring a component with styles and template', () => {
    it('renders the component styles and template', () => {
      document.body.innerHTML = '<element-two></element-two>';
      const doc = document.implementation.createHTMLDocument();
      const classTwo = document.querySelector('element-two') as ElementTwo;

      doc.adoptNode(classTwo);
      classTwo.attribute = 'value';
      classTwo.reference.dispatchEvent(new Event('change'));

      expect(classTwo).toBeInstanceOf(ElementTwo);
      expect(classTwo.attribute).toBe(classTwo.getAttribute('attribute'));
      expect(classTwo.shadowRoot?.innerHTML).toContain(classTwo.styles[0]);
      expect(classTwo.shadowRoot?.innerHTML).toContain('<div></div>');
    });
  });

  describe('declaring a component extending an element', () => {
    it('renders the extended element as the component', () => {
      document.body.innerHTML = '<main is="main-element"></main>';
      const doc = document.implementation.createHTMLDocument();
      const classMain = document.querySelector('main[is]') as MainElement;

      doc.adoptNode(classMain);
      classMain.attribute = 'value';
      classMain.reference.dispatchEvent(new Event('change'));

      expect(classMain).toBeInstanceOf(MainElement);
      expect(classMain.attribute).toBe(classMain.getAttribute('attribute'));
      expect(classMain.outerHTML).toContain('attribute="value"');
      expect(classMain.outerHTML).toContain('is="main-element"');
    });
  });

});
