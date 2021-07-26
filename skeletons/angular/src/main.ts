import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Module } from './module';

platformBrowserDynamic().bootstrapModule(Module, {
  ngZone: 'noop'
}).catch((error) => {
  console.error(error);
});
