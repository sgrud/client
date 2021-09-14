/**
 * `@sgrud/bus` - The [SGRUD](https://github.com/sgrud/client) software bus.
 *
 * The functionality implemented within this package is intended to ease the
 * inter-component-communication of applications building upon the `@sgrud`
 * libraries. By establishing conduits between different aspects of an
 * application or between plugins extending an application, loose coupling of
 * data transferral can be achieved.
 *
 * The different functions and classes implemented within this module can be
 * roughly categorized into the following functional aspects.
 *
 * - Conduit handling functionality
 *   - {@link ConduitHandler}: singleton class orchestrating all conduits
 *   - {@link ConduitWorker}: `WebWorker` handling all conduit compilation
 *   - {@link Publish}: property decorator publishing the decorated conduit
 *   - {@link Subscribe}: property decorator subscribing to a conduit
 *
 * @packageDocumentation
 */

export * from './src/conduit/handler';
export * from './src/conduit/worker';
export * from './src/pubsub/publish';
export * from './src/pubsub/subscribe';
