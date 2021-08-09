/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./types.d.ts"/>

import register from 'preact-custom-element';
import PreactComponent from './component/PreactComponent';

register(PreactComponent, undefined, undefined, { shadow: true });
