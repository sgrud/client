/**
 * `@sgrud/shell` - The [SGRUD][] Web UI Shell.
 *
 * The functions and classes found within this module are intended to ease the
 * implementation of [Component][]-based frontends by providing [JSX][] runtime
 * bindings for the [incremental-dom][] library and a [Router][] targeted at
 * routing through [Component][]s based upon the [SGRUD][] client libraries, but
 * not limited to those. Furthermore, complex routing strategies and actions may
 * be implemented through the interceptor-like [RouterTask][] pattern.
 *
 * [Component]: https://sgrud.github.io/client/interfaces/shell.Component-1
 * [incremental-dom]: https://google.github.io/incremental-dom
 * [JSX]: https://www.typescriptlang.org/docs/handbook/jsx.html
 * [Router]: https://sgrud.github.io/client/classes/shell.Router
 * [RouterTask]: https://sgrud.github.io/client/classes/shell.RouterTask
 * [SGRUD]: https://sgrud.github.io
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
export * from './src/task/catch';
export * from './src/task/resolve';
