import { Component } from 'preact';
import { JSXInternal } from 'preact/src/jsx';
import styles from './PreactComponent.sass';

declare global {
  interface HTMLElementTagNameMap {
    'preact-component': PreactComponent;
  }
}

interface Props {
  name: string;
}

export class PreactComponent extends Component<Props> {

  public static override defaultProps: Props = {
    name: 'world'
  };

  public static observedAttributes: string[] = [
    'name'
  ];

  public static tagName: string = 'preact-component';

  public override render(props: Props): JSXInternal.Element {
    return <>
      <style>
        {styles}
      </style>
      <div>
        <h1>preact-component says hello {props.name}</h1>
        <div><slot></slot></div>
      </div>
    </>;
  }

}
