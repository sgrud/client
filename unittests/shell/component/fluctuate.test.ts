import { Component, Fluctuate } from '@sgrud/shell';
import { BehaviorSubject, NEVER, Subscription } from 'rxjs';

describe('@sgrud/shell/component/fluctuate', () => {

  /*
   * Variables
   */

  class Element extends HTMLElement {

    @Fluctuate(() => NEVER)
    public unknown?: string;

  }

  customElements.define('element-tag', Element);

  @Component('element-one')
  class ElementOne extends HTMLElement implements Component {

    @Fluctuate(() => fluctuate)
    public fluctuate?: string;

    @Fluctuate(() => NEVER)
    public unknown?: string;

  }

  @Component('element-two')
  class ElementTwo extends HTMLElement implements Component {

    @Fluctuate(() => fluctuate)
    public fluctuate?: string;

    @Fluctuate(() => NEVER)
    public unknown?: string;

  }

  const fluctuate = new BehaviorSubject<string>('default');

  /*
   * Unittests
   */

  describe('applying the decorator to a component', () => {
    it('subscribes to the supplied stream factory', () => {
      document.body.innerHTML = '<element-tag></element-tag>';
      const element = document.querySelector<Element>('element-tag')!;
      const fluctuations = (element as Component).observedFluctuations;

      expect(element.unknown).toBeUndefined();
      expect(fluctuations!.unknown).toBeInstanceOf(Subscription);
    });
  });

  describe('emittance of the supplied stream factory', () => {
    it('calls the appropriate callback and provides the next value', () => {
      document.body.innerHTML = '<element-one></element-one>';
      const elementOne = document.querySelector<ElementOne>('element-one')!;
      const spy = jest.spyOn(elementOne, 'fluctuationChangedCallback' as any);

      fluctuate.next('done');

      expect(elementOne.fluctuate).toBe('done');
      expect(spy).toBeCalledWith('fluctuate', 'default', 'done');
    });
  });

  describe('disconnecting a decorated component from the dom', () => {
    it('unsubscribes from the supplied stream factory', () => {
      document.body.innerHTML = '<element-two></element-two>';
      const elementTwo = document.querySelector<ElementTwo>('element-two')!;
      const fluctuations = (elementTwo as Component).observedFluctuations;

      elementTwo.remove();

      expect(fluctuations!.fluctuate).toBeInstanceOf(Subscription);
      expect(fluctuations!.fluctuate.closed).toBeTruthy();
    });
  });

});
