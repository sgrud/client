import register from 'preact-custom-element';
import { PreactComponent } from './component/PreactComponent';

register(PreactComponent, PreactComponent.tagName, undefined, {
  shadow: true
});
