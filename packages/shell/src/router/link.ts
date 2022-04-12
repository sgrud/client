import { Factor } from '@sgrud/core';
import { customElements } from '../component/registry';
import { Router } from './router';

declare global {
  interface HTMLElementTagNameMap {
    'router-link': RouterLink;
  }
}

/**
 * Custom component extending the `HTMLAnchorElement`. This component provides a
 * declarative way to invoke the {@link Router}, while maintaining compatibility
 * with SSR/SEO aspects of SPAs. This is achieved by rewriting absolute `href`s
 * to be contained within the {@link Router.baseHref} and replacing the default
 * browser behavior when {@link onclick}ed with {@link Router.navigate}.
 *
 * @example A `router-link`.
 * ```html
 * <a href="/example" is="router-link">Example</a>
 * ```
 *
 * @see {@link Route}
 * @see {@link Router}
 */
export class RouterLink extends HTMLAnchorElement {

  /**
   * Array of attribute names, which should be observed for changes, which will
   * trigger the {@link attributeChangedCallback}. This component only observes
   * the `href` attribute.
   */
  public static readonly observedAttributes: string[] = [
    'href'
  ];

  /**
   * Factored-in router property retrieving the linked {@link Router}.
   *
   * @decorator {@link Factor}
   */
  @Factor(() => Router)
  private readonly router!: Router;

  public constructor() {
    super();

    if (this.hasAttribute('href')) {
      this.attributeChangedCallback('', '', this.getAttribute('href')!);
    }
  }

  /**
   * Called when the component's `href` attribute is added, removed or changed.
   * The `next` attribute value is used to determine wether to rewrite the
   * `href` by passing it through the {@link Router.rebase} method.
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
   * Overridden `onclick` handler, preventing the default browser behavior and
   * calling the {@link Router.navigate} method instead.
   *
   * @param event - Mouse click event.
   */
  public override onclick: (event: MouseEvent) => void = (event) => {
    const { hash, pathname, search } = this;
    event.preventDefault();

    this.router.navigate(pathname + hash, search).subscribe((state) => {
      history.pushState(state, '', this.router.rebase(state.path));
    });
  };

}

/**
 * Registration of this custom element with the `CustomElementRegistry`.
 */
customElements.define('router-link', RouterLink, { extends: 'a' });
