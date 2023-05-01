/**
 * **`@sgrud/bus`** - The [SGRUD](https://sgrud.github.io) Software Bus.
 *
 * The functions and classes found within the **`@sgrud/bus`** module are
 * intended to ease the internal and external real-time communication of
 * applications building upon the [SGRUD](https://sgrud.github.io) client
 * libraries. By establishing a {@link Bus} between different modules of an
 * application or between the core of an application and plugins extending it,
 * or even between different applications, loose coupling and data transferral
 * can be achieved.
 *
 * The **`@sgrud/bus`** module includes a standalone JavaScript bundle which is
 * used to {@link Spawn} a background {@link Thread} upon import of this module.
 * This background {@link Thread} is henceforth used as central hub for data
 * exchange. Depending on the runtime environment, either a `new Worker()` or a
 * `new require('worker_threads').Worker()` NodeJS equivalent will be
 * {@link Spawn}ed.
 *
 * @packageDocumentation
 */

export * from './src/bus/bus';
export * from './src/bus/querier';
export * from './src/bus/transfer';
export * from './src/handler/handler';
export * from './src/handler/observe';
export * from './src/handler/publish';
export * from './src/handler/stream';
