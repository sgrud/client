import { Attribute, Component, jsx } from '@sgrud/shell';

globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (_, target, args) => {
    return Reflect.construct(HTMLElement, args, target.constructor);
  }
});

describe('@sgrud/shell/element/component', () => {

  @Component('class-one')
  class ClassOne extends HTMLElement { }

  @Component('class-two')
  class ClassTwo extends HTMLElement implements Component {
    @Attribute() public attribute?: string;
    public readonly styles: string[] = [':host { color: green; }'];
    public readonly template: JSX.Element = jsx('div');
  }

  @Component('class-main', 'main')
  class ClassMain extends HTMLElement implements Component {
    @Attribute() public attribute?: string;
    public attributeChangedCallback(): void {
      return;
    }
    public connectedCallback(): void {
      return;
    }
    public renderComponent(): void {
      return;
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

    document.body.append(document.body.removeChild(classTwo));
    classTwo.attribute = 'value';

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

    classMain.attribute = 'value';
    classMain.renderComponent();

    it('renders the extended element as the component', () => {
      expect(classMain).toBeInstanceOf(ClassMain);
      expect(classMain.attribute).toBe(classMain.getAttribute('attribute'));
      expect(classMain.outerHTML).toContain('attribute="value"');
      expect(classMain.outerHTML).toContain('is="class-main"');
    });
  });

});
