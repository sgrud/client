import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class VueComponent extends Vue {

  @Prop({
    default: 'world',
    type: String
  })
  public name!: string;

}
