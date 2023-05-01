import { Attribute, Component, createElement, Fluctuate, Reference, render } from '@sgrud/shell';
import { BehaviorSubject } from 'rxjs';

describe('@sgrud/shell/component/component', () => {

  /*
   * Variables
   */

  @Component('element-one')
  class ElementOne extends HTMLElement implements Component {

    public constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

  }

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {

    @Attribute()
    public attribute?: string;

    @Fluctuate(() => fluctuate)
    public fluctuate?: string;

    @Reference('key', ['change'])
    public reference?: HTMLDivElement;

    public readonly styles: string[] = [':host { color: green; }'];

    public readonly template: JSX.Element = createElement('div', {
      key: 'key'
    });

  }

  @Component('element-tag', 'main')
  class MainElement extends HTMLElement implements Component {

    @Attribute()
    public attribute?: string;

    @Fluctuate(() => fluctuate)
    public fluctuate?: string;

    @Reference('key', ['change'])
    public reference?: HTMLDivElement;

    public readonly template: JSX.Element = createElement('div', {
      key: 'key'
    });

    public connectedCallback(): void {
      this.renderComponent();
    }

    public attributeChangedCallback(): void {
      this.renderComponent();
    }

    public fluctuationChangedCallback(): void {
      this.renderComponent();
    }

    public referenceChangedCallback(): void {
      this.renderComponent();
    }

    public renderComponent(): void {
      render(this.shadowRoot!, this.template);
    }

  }

  const fluctuate = new BehaviorSubject<string>('default');

  /*
   * Unittests
   */

  describe('declaring a component without styles and template', () => {
    it('renders a slot element', () => {
      document.body.innerHTML = '<element-one></element-one>';
      const elementOne = document.querySelector<ElementOne>('element-one')!;

      expect(elementOne).toBeInstanceOf(ElementOne);
      expect(elementOne.shadowRoot!.innerHTML).toBe('<slot></slot>');
    });
  });

  describe('declaring a component with styles and template', () => {
    it('renders the component styles and template', () => {
      document.body.innerHTML = '<element-two></element-two>';
      const elementTwo = document.querySelector<ElementTwo>('element-two')!;

      elementTwo.attribute = 'value';
      elementTwo.reference!.dispatchEvent(new Event('change'));

      expect(elementTwo).toBeInstanceOf(ElementTwo);
      expect(elementTwo.attribute).toBe(elementTwo.getAttribute('attribute'));
      expect(elementTwo.fluctuate).toBe(fluctuate.value);
      expect(elementTwo.shadowRoot!.innerHTML).toContain(elementTwo.styles[0]);
      expect(elementTwo.shadowRoot!.innerHTML).toContain('<div></div>');
    });
  });

  describe('declaring a component extending an element', () => {
    it('renders the extended element as the component', () => {
      document.body.innerHTML = '<main is="element-tag"></main>';
      const elementMain = document.querySelector<MainElement>('main[is]')!;

      fluctuate.next('done');
      elementMain.setAttribute('attribute', 'value');
      elementMain.reference!.dispatchEvent(new Event('change'));

      expect(elementMain).toBeInstanceOf(MainElement);
      expect(elementMain.attribute).toBe(elementMain.getAttribute('attribute'));
      expect(elementMain.fluctuate).toBe(fluctuate.value);
      expect(elementMain.outerHTML).toContain('attribute="value"');
      expect(elementMain.outerHTML).toContain('is="element-tag"');
    });
  });

});
