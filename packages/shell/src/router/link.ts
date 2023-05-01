import { Factor, TypeOf } from '@sgrud/core';
import { customElements } from '../component/registry';
import { Router } from './router';

declare global {
  interface HTMLElementTagNameMap {

    /**
     * @see {@link RouterLink}
     */
    'router-link': RouterLink;

  }
}

/**
 * Custom element extending the {@link HTMLAnchorElement}. This element provides
 * a declarative way to invoke the {@link Router.navigate} method within the
 * bounds of the {@link RouterOutlet}, while maintaining compatibility with
 * SSR/SEO aspects of SPAs. This is achieved by rewriting its {@link href}
 * against the {@link RouterOutlet.baseHref} and intercepting the default
 * browser behavior when {@link onclick}ed.
 *
 * @example
 * A `router-link`:
 * ```html
 * <a href="/example" is="router-link">Example</a>
 * ```
 *
 * @see {@link Router}
 */
export class RouterLink extends HTMLAnchorElement {

  /**
   * Array of attribute names that should be observed for changes, which will
   * trigger the {@link Component.attributeChangedCallback}. This element only
   * observes its {@link href} attribute.
   */
  public static readonly observedAttributes: string[] = [
    'href'
  ];

  /**
   * {@link Factor}ed-in **router** property linking the {@link Router}.
   *
   * @decorator {@link Factor}
   */
  @Factor(() => Router)
  private readonly router!: Router;

  /**
   * Public **constructor** of this custom {@link RouterLink} element. This
   * **constructor** is called whenever a new instance this custom element is
   * being rendered into a {@link Document}.
   */
  public constructor() {
    super();

    const href = this.getAttribute('href');

    if (TypeOf.string(href)) {
      this.attributeChangedCallback('href', undefined, href);
    }
  }

  /**
   * This method is called whenever this element's {@link href} attribute is
   * added, removed or changed. The `next` attribute value is used to determine
   * wether to {@link Router.rebase} the {@link href}.
   *
   * @param _name - The `_name` of the changed attribute (ignored).
   * @param _prev - The `_prev`ious value of the changed attribute (ignored).
   * @param next - The `next` value of the changed attribute.
   */
  public attributeChangedCallback(
    _name: string,
    _prev?: string,
    next?: string
  ): void {
    if (next?.startsWith('/') && !next.startsWith(this.router.baseHref)) {
      const { pathname } = new URL(next, location.origin);
      this.href = this.router.rebase(pathname);
    }
  }

  /**
   * Overridden **onclick** handler, preventing the default browser behavior and
   * invoking {@link Router.navigate} instead.
   *
   * @param event - The **onclick** fired {@link MouseEvent}.
   */
  public override readonly onclick: (event: MouseEvent) => void = (event) => {
    const { hash, pathname, search } = this;
    this.router.navigate(pathname + hash, search).subscribe();
    event.preventDefault();
  };

}

/**
 * Registration of this custom element.
 */
customElements.define('router-link', RouterLink, {
  extends: 'a'
});
