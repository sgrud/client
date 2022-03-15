import { Component, Input, ViewEncapsulation } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';

declare global {
  interface HTMLElementTagNameMap {
    'angular-component': NgElement & WithProperties<{
      name: string;
    }>;
  }
}

@Component({
  template: `
    <div>
      <h1>angular-component says hello {{ name }}</h1>
      <div><slot></slot></div>
    </div>
  `,
  styleUrls: ['./angular.component.sass'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class AngularComponent {

  @Input()
  public name: string = 'world';

}
