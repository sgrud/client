globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

import { Attribute, Component, jsx, Reference, render } from '@sgrud/shell';

declare global {
  interface HTMLElementTagNameMap {
    'class-one': HTMLElement;
    'class-two': HTMLElement;
    'class-main': HTMLElement;
  }
}

describe('@sgrud/shell/component/component', () => {

  @Component('class-one')
  class ClassOne extends HTMLElement implements Component {
    public constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  }

  @Component('class-two')
  class ClassTwo extends HTMLElement implements Component {
    @Attribute() public attribute?: string;
    @Reference('key', ['change']) public reference?: HTMLDivElement;
    public readonly styles: string[] = [':host { color: green; }'];
    public readonly template: JSX.Element = jsx('div', { key: 'key' });
  }

  @Component('class-main', 'main')
  class ClassMain extends HTMLElement implements Component {
    @Attribute() public attribute?: string;
    @Reference('key', ['change']) public reference?: HTMLDivElement;
    public readonly template: JSX.Element = jsx('div', { key: 'key' });
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
    document.body.innerHTML = '<class-one></class-one>';
    const classOne = document.body.firstChild as ClassOne;

    it('renders a slot element', () => {
      expect(classOne).toBeInstanceOf(ClassOne);
      expect(classOne.shadowRoot?.innerHTML).toBe('<slot></slot>');
    });
  });

  describe('declaring a component with styles and template', () => {
    document.body.innerHTML = '<class-two></class-two>';
    const classTwo = document.body.firstChild as ClassTwo;
    const doc = document.implementation.createHTMLDocument();

    doc.adoptNode(classTwo);
    classTwo.attribute = 'value';
    classTwo.reference!.dispatchEvent(new Event('change'));

    it('renders the component styles and template', () => {
      expect(classTwo).toBeInstanceOf(ClassTwo);
      expect(classTwo.attribute).toBe(classTwo.getAttribute('attribute'));
      expect(classTwo.shadowRoot?.innerHTML).toContain(classTwo.styles[0]);
      expect(classTwo.shadowRoot?.innerHTML).toContain('<div></div>');
    });
  });

  describe('declaring a component extending an element', () => {
    document.body.innerHTML = '<main is="class-main"></main>';
    const classMain = document.body.firstChild as ClassMain;
    const doc = document.implementation.createHTMLDocument();

    doc.adoptNode(classMain);
    classMain.attribute = 'value';
    classMain.reference!.dispatchEvent(new Event('change'));

    it('renders the extended element as the component', () => {
      expect(classMain).toBeInstanceOf(ClassMain);
      expect(classMain.attribute).toBe(classMain.getAttribute('attribute'));
      expect(classMain.outerHTML).toContain('attribute="value"');
      expect(classMain.outerHTML).toContain('is="class-main"');
    });
  });

});
