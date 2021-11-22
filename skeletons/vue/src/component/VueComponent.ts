import { Component, Prop, Vue } from 'vue-property-decorator';

declare global {
  interface HTMLElementTagNameMap {
    'vue-component': Element & VueComponent;
  }
}

@Component
export default class VueComponent extends Vue {

  @Prop({
    default: 'world',
    type: String
  })
  public name!: string;

}
