import { Factor } from '@sgrud/core';
import { customElements } from '../component/registry';
import { Router } from './router';

declare global {
  interface HTMLElementTagNameMap {

    /**
     * [RouterLink]: https://sgrud.github.io/client/classes/shell.RouterLink
     *
     * @see [RouterLink][]
     */
    'router-link': RouterLink;

  }
}

/**
 * Custom element extending the [HTMLAnchorElement][]. This element provides a
 * declarative way to invoke the [Router][], while maintaining compatibility
 * with SSR/SEO aspects of SPAs. This is achieved by rewriting absolute *href*s
 * to be contained within the applications base href and intercepting the
 * default browser behavior when *onclick*ed.
 *
 * [HTMLAnchorElement]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement
 * [Router]: https://sgrud.github.io/client/classes/shell.Router
 *
 * @example
 * A `router-link`:
 * ```html
 * <a href="/example" is="router-link">Example</a>
 * ```
 *
 * @see [Router][]
 */
export class RouterLink extends HTMLAnchorElement {

  /**
   * Array of attribute names, which should be observed for changes, which will
   * trigger the *attributeChangedCallback*. This element only observes the
   * `href` attribute.
   */
  public static readonly observedAttributes: string[] = [
    'href'
  ];

  /**
   * [Factor][]ed-in **router** property retrieving the linked [Router][].
   *
   * [Factor]: https://sgrud.github.io/client/functions/core.Factor
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   *
   * @decorator [Factor][]
   */
  @Factor(() => Router)
  private readonly router!: Router;

  /**
   * Public **constructor** of this custom element. This **constructor** is
   * called whenever an instance this custom element is rendered.
   */
  public constructor() {
    super();

    if (this.hasAttribute('href')) {
      this.attributeChangedCallback('href', null!, this.getAttribute('href')!);
    }
  }

  /**
   * This method id called whenever the element's `href` attribute is added,
   * removed or changed. The `next` attribute value is used to determine wether
   * to rewrite the `href` by letting the [Router][] *rebase* it.
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   *
   * @param _name - Attribute name (ignored).
   * @param _prev - Previous value (ignored).
   * @param next - Next value.
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
   * letting the [Router][] handle the navigation instead.
   *
   * [Router]: https://sgrud.github.io/client/classes/shell.Router
   *
   * @param event - Mouse click event.
   */
  public override onclick: (event: MouseEvent) => void = (event) => {
    const { hash, pathname, search } = this;
    event.preventDefault();

    this.router.navigate(pathname + hash, search).subscribe();
  };

}

/**
 * Registration of this custom element.
 */
customElements.define('router-link', RouterLink, { extends: 'a' });
