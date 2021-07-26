import { Component, Input } from '@angular/core';

@Component({
  templateUrl: './angular.component.html',
  styleUrls: ['./angular.component.sass']
})
export class AngularComponent {

  @Input()
  public name: string = 'world';

}
