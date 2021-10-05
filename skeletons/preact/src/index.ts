// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types.d.ts"/>

import register from 'preact-custom-element';
import PreactComponent from './component/PreactComponent';

register(PreactComponent, PreactComponent.tagName, undefined, { shadow: true });
