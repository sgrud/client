import { attr, customElement, FASTElement, html } from '@microsoft/fast-element';
import styles from './fast-component.sass';

declare global {
  interface HTMLElementTagNameMap {
    'fast-component': FastComponent;
  }
}

@customElement({
  name: 'fast-component',
  styles: styles.toString(),
  template: html<FastComponent>`
    <div>
      <h1>fast-component says hello ${(e) => e.name}</h1>
      <div><slot></slot></div>
    </div>
  `
})
export default class FastComponent extends FASTElement {

  @attr
  public name: string = 'world';

}
