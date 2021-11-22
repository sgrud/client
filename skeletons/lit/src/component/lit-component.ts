import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

declare global {
  interface HTMLElementTagNameMap {
    'lit-component': LitComponent;
  }
}

@customElement('lit-component')
export default class LitComponent extends LitElement {

  public static override styles: CSSResultGroup = css`
    h1 {
      font-style: italic;
    }
  `;

  @property({
    type: String
  })
  public name: string = 'world';

  public override render(): TemplateResult {
    return html`
      <div>
        <h1>lit-component says hello ${this.name}</h1>
        <div><slot></slot></div>
      </div>
    `;
  }

  protected override createRenderRoot(): Element | ShadowRoot {
    while (this.shadowRoot?.hasChildNodes()) {
      this.shadowRoot.removeChild(this.shadowRoot.lastChild!);
    }

    return super.createRenderRoot();
  }

}
