/**
 * **`@sgrud/state`** - The [SGRUD](https://sgrud.github.io) State Machine.
 *
 * The functions and classes found within the **`@sgrud/state`** module are
 * intended to ease the implementation of {@link Stateful} data {@link Store}s
 * within applications built upon the [SGRUD](https://sgrud.github.io) client
 * libraries. Through wrappers around the {@link IndexedDB} and {@link SQLite3}
 * storage {@link Store.Driver}s, data will be persisted in every environment.
 * Furthermore, through the employment of {@link Effect}s, side-effects like
 * retrieving data from external services or dispatching subsequent
 * {@link Store.Action}s can be easily achieved.
 *
 * The **`@sgrud/state`** module includes a standalone JavaScript bundle which
 * is used to fork a background {@link Thread} upon import of this module. This
 * background {@link Thread} is henceforth used for {@link Store.State} mutation
 * and persistance, independently of the foreground process. Depending on the
 * runtime environment, either a `navigator.serviceWorker` is `register`ed or a
 * `new require('worker_threads').Worker()` NodeJS equivalent will be forked.
 *
 * @packageDocumentation
 */

export * from './src/driver/indexeddb';
export * from './src/driver/sqlite3';
export * from './src/effect/dispatch';
export * from './src/effect/effect';
export * from './src/effect/fetch';
export * from './src/effect/state';
export * from './src/effect/transfer';
export * from './src/handler/handler';
export * from './src/handler/implant';
export * from './src/handler/stateful';
export * from './src/store/store';
export * from './src/store/transfer';
