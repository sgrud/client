import { Linker } from '@sgrud/core';
import { customElements } from '../component/registry';
import { Router } from './router';

declare global {
  interface HTMLElementTagNameMap {

    /**
     * [RouterOutlet]: https://sgrud.github.io/client/classes/shell.RouterOutlet
     *
     * @see [RouterOutlet][]
     */
    'router-outlet': RouterOutlet;

  }
}

/**
 * Custom element extending the [HTMLSlotElement][]. When this element is
 * constructed, it supplies the value of its *baseHref* attribute and the
 * presence of a *hashBased* attribute on itself to the [Router][] while
 * *bind*ing the [Router][] to itself. This element should only be used once, as
 * it will be used by the [Router][] as *outlet* to render the current
 * [State][].
 *
 * [HTMLSlotElement]: https://developer.mozilla.org/docs/Web/API/HTMLSlotElement
 * [Router]: https://sgrud.github.io/client/classes/shell.Router
 * [State]: https://sgrud.github.io/client/interfaces/shell.Router-1.State
 *
 * @example
 * A `router-outlet`:
 * ```html
 * <slot baseHref="/example" is="router-outlet">Loading...</slot>
 * ```
 *
 * @see [Router][]
 */
export class RouterOutlet extends HTMLSlotElement {

  /**
   * Getter mirroring the **baseHref** attribute of the element.
   */
  public get baseHref(): string | undefined {
    return this.getAttribute('baseHref') || undefined;
  }

  /**
   * Getter mirroring the presence of a **hashBased** attribute on the element.
   */
  public get hashBased(): boolean {
    return this.hasAttribute('hashBased');
  }

  /**
   * Custom element **constructor**. Supplies the value of its *baseHref*
   * attribute and the presence of a *hashBased* attribute on itself to the
   * [Router][] while *bind*ing the [Router][] to itself. It furthermore invokes
   * a `setTimeout` loop, running until the number of routes the router contains
   * evaluates truthy, which in turn triggers an initial navigation.
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   */
  public constructor() {
    super();

    const { hash, pathname, search } = location;
    const router = new Linker<typeof Router>().get(Router);

    router.bind(this, this.baseHref, this.hashBased);

    (function navigate(): void {
      if (router.size) {
        router.navigate(pathname + hash, search, true).subscribe();
      } else {
        setTimeout(navigate);
      }
    })();
  }

}

/**
 * Registration of this custom element.
 */
customElements.define('router-outlet', RouterOutlet, {
  extends: 'slot'
});
