/**
 * **`@sgrud/shell`** - The [SGRUD](https://sgrud.github.io) Web UI Shell.
 *
 * The functions and classes found within the **`@sgrud/shell`** module are
 * intended to ease the implementation of {@link Component}-based frontends by
 * providing {@link JSX} runtime bindings via the `@sgrud/shell/jsx-runtime`
 * module for the [incremental-dom](https://github.com/google/incremental-dom)
 * library and the {@link Router} to enable routing through {@link Component}s
 * based upon the [SGRUD](https://sgrud.github.io) client libraries, but not
 * limited to those. Furthermore, complex routing strategies and actions may be
 * implemented through the interceptor-like {@link Queue} pattern.
 *
 * @packageDocumentation
 */

export * from './src/component/attribute';
export * from './src/component/component';
export * from './src/component/fluctuate';
export * from './src/component/reference';
export * from './src/component/registry';
export * from './src/component/runtime';
export * from './src/queue/catch';
export * from './src/queue/queue';
export * from './src/queue/resolve';
export * from './src/router/link';
export * from './src/router/outlet';
export * from './src/router/route';
export * from './src/router/router';
