import { Factor } from '@sgrud/core';
import { first, from, switchMap } from 'rxjs';
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
 * Custom element extending the {@link HTMLSlotElement}. When this element is
 * constructed, it supplies the value of its {@link baseHref} attribute and the
 * presence of a {@link hashBased} attribute on itself to the {@link Router}
 * while {@link Router.connect}ing the {@link Router} to itself. This element
 * should only be used once, as it will be used by the {@link Router} as
 * {@link Router.outlet} to render the current {@link Router.State}.
 *
 * @example
 * A `router-outlet`:
 * ```html
 * <slot baseHref="/example" is="router-outlet">Loading...</slot>
 * ```
 *
 * @see {@link Router}
 */
export class RouterOutlet extends HTMLSlotElement {

  /**
   * {@link Factor}ed-in **router** property linking the {@link Router}.
   *
   * @decorator {@link Factor}
   */
  @Factor(() => Router)
  private readonly router!: Router;

  /**
   * Getter mirroring the **baseHref** attribute of this element.
   */
  public get baseHref(): string | undefined {
    return this.getAttribute('baseHref') || undefined;
  }

  /**
   * Getter mirroring the presence of a **hashBased** attribute on this element.
   */
  public get hashBased(): boolean {
    return this.hasAttribute('hashBased');
  }

  /**
   * Public **constructor** of this custom {@link RouterOutlet} element.
   * Supplies the value of its {@link baseHref} attribute and the presence of a
   * {@link hashBased} attribute on itself to the {@link Router} while
   * {@link Router.connect}ing the {@link Router} to itself.
   */
  public constructor() {
    super();

    const { hash, pathname, search } = location;
    this.router.connect(this, this.baseHref, this.hashBased);

    from(Router).pipe(first(), switchMap(() => {
      return this.router.navigate(pathname + hash, search, 'replace');
    })).subscribe();
  }

}

/**
 * Registration of this custom element.
 */
customElements.define('router-outlet', RouterOutlet, {
  extends: 'slot'
});
