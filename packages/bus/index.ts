/**
 * `@sgrud/bus` - The [SGRUD][] Software Bus.
 *
 * The functions and classes found within this module are intended to ease the
 * internal communication of applications building upon the [SGRUD][] client
 * libraries. By establishing busses between different modules of an application
 * or between an application and plugins extending it, loose coupling of data
 * transferral and functionality can be achieved. This module includes a
 * standalone JavaScript bundle which will be used to instantiate a [Worker][],
 * which is used as central hub for data exchange.
 *
 * [SGRUD]: https://sgrud.github.io
 * [Worker]: https://developer.mozilla.org/docs/Web/API/Worker/Worker
 *
 * @packageDocumentation
 */

export * from './src/conduit/handler';
export * from './src/conduit/worker';
export * from './src/pubsub/publish';
export * from './src/pubsub/subscribe';
