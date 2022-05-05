import { Linker } from '@sgrud/core';
import { customElements } from '../component/registry';
import { Router } from './router';

declare global {
  interface HTMLElementTagNameMap {

    /**
     * @see {@link RouterOutlet}
     */
    'router-outlet': RouterOutlet;

  }
}

/**
 * Custom element extending the `HTMLSlotElement`. When this component is
 * constructed, it binds the {@link Router} to itself while supplying the value
 * of its {@link baseHref} attribute as {@link Router.baseHref} and the presence
 * of a {@link hashBased} attribute on itself as {@link Router.hashBased}. This
 * component should only be used once, as it will be used by the {@link Router}
 * as {@link Router.outlet} to render the current {@link Router.State}.
 *
 * @example A `router-outlet`.
 * ```html
 * <slot baseHref="/example" is="router-outlet">Loading...</slot>
 * ```
 *
 * @see {@link Route}
 * @see {@link Router}
 */
export class RouterOutlet extends HTMLSlotElement {

  /**
   * Getter mirroring the `baseHref` attribute of the component.
   */
  public get baseHref(): string | undefined {
    return this.getAttribute('baseHref') || undefined;
  }

  /**
   * Getter mirroring the presence of a `hashBased` attribute on the component.
   */
  public get hashBased(): boolean {
    return this.hasAttribute('hashBased');
  }

  /**
   * Custom `router-outlet` component constructor. Invokes {@link Router.bind}
   * on itself while supplying its {@link baseHref} attribute value and the
   * presence of a {@link hashBased} attribute on itself. It furthermore invokes
   * a `setTimeout` loop running until the number of routes the router contains
   * evaluates truthy, which in turn triggers an initial {@link Router.navigate}
   * invocation.
   */
  public constructor() {
    super();

    const { pathname, search } = location;
    const router = new Linker<typeof Router>().get(Router);

    router.bind(this, this.baseHref, this.hashBased);

    (function navigate(): void {
      if (router.size) {
        router.navigate(pathname, search, true).subscribe();
      } else {
        setTimeout(navigate);
      }
    })();
  }

}

/**
 * Registration of this custom element with the `CustomElementRegistry`.
 */
customElements.define('router-outlet', RouterOutlet, {
  extends: 'slot'
});
