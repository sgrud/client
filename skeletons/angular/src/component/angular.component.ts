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
  templateUrl: './angular.component.html',
  styleUrls: ['./angular.component.sass'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class AngularComponent {

  @Input()
  public name: string = 'world';

}
