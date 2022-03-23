import { CSSResultGroup, html, LitElement, TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import styles from './lit-component.sass';

declare global {
  interface HTMLElementTagNameMap {
    'lit-component': LitComponent;
  }
}

@customElement('lit-component')
export class LitComponent extends LitElement {

  public static override styles: CSSResultGroup = unsafeCSS(styles);

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
