import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserModule } from '@angular/platform-browser';
import { AngularComponent } from './component/angular.component';

@NgModule({
  declarations: [
    AngularComponent
  ],
  entryComponents: [
    AngularComponent
  ],
  imports: [
    BrowserModule
  ]
})
export class Module implements DoBootstrap {

  public constructor(
    private readonly injector: Injector
  ) {
    customElements.define(
      'angular-component',
      createCustomElement(AngularComponent, { injector: this.injector })
    );
  }

  public ngDoBootstrap(): void {
    return;
  }

}
