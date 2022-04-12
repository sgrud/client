/**
 * `@sgrud/shell` - The [SGRUD](https://github.com/sgrud/client) web UI shell.
 *
 * The functions and classes found within this module ease the implementation of
 * component-based frontends by providing `jsx-runtime`-compliant bindings and a
 * router targeted at rendering components based upon the `@sgrud` libraries,
 * but not limited to those. Furthermore, complex routing strategies and actions
 * may be implemented through interceptor-like router tasks.
 *
 * The different functions and classes implemented within this module can be
 * roughly categorized into the following functional aspects.
 *
 * - Custom components and their dynamic rendering
 *   - {@link Component}: registers the decorated class as custom component
 *   - {@link Attribute}: binds the decorated property to a component attribute
 *   - {@link Reference}: binds the decorated property to a referenced node
 *   - {@link customElements}: Extension of the built-in `customElements` object
 * - `jsx-runtime`-compliant bindings
 *   - {@link createElement}: `incremental-dom`-based JSX element factory
 *   - {@link createFragment}: JSX fragment (placeholder html element) factory
 *   - {@link render}:  `incremental-dom`-based JSX rendering helper
 * - Client-side component-based routing
 *   - {@link Router}: provides routing and rendering capabilities
 *   - {@link RouterTask}: abstract base class to implement router tasks
 *   - {@link RouterOutlet}: declarative rendering outlet for the router
 *   - {@link RouterLink}: declarative trigger for router navigations
 *   - {@link Route}: associates a route to the decorated component
 *
 * @packageDocumentation
 */

export * from './src/component/attribute';
export * from './src/component/component';
export * from './src/component/reference';
export * from './src/component/registry';
export * from './src/component/runtime';
export * from './src/router/link';
export * from './src/router/outlet';
export * from './src/router/route';
export * from './src/router/router';
export * from './src/router/task';
