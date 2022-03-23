import { Attribute, Component } from '@sgrud/shell';
import styles from './sgrud-component.sass';

declare global {
  interface HTMLElementTagNameMap {
    'sgrud-component': SgrudComponent;
  }
}

@Component('sgrud-component')
export class SgrudComponent extends HTMLElement {

  @Attribute()
  public name: string = 'world';

  public readonly styles: string[] = [styles.toString()];

  public get template(): JSX.Element {
    return <>
      <div>
        <h1>sgrud-component says hello {this.name}</h1>
        <div><slot></slot></div>
      </div>
    </>;
  }

}
