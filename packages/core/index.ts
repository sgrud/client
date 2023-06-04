/**
 * **`@sgrud/core`** - The [SGRUD](https://sgrud.github.io) Core Module.
 *
 * The functions and classes found within the **`@sgrud/core`** module represent
 * the base upon which the [SGRUD](https://sgrud.github.io) client libraries are
 * built. Therefore, most of the code provided within this module does not aim
 * at fulfilling one specific high-level need, but is used and intended to be
 * used as low-level building blocks for downstream projects. This practice is
 * employed throughout the [SGRUD](https://sgrud.github.io) client libraries, as
 * all modules depend on this core module. By providing the core functionality
 * within this singular module, all downstream [SGRUD](https://sgrud.github.io)
 * modules should be considered opt-in functionality which may be used within
 * projects building upon the [SGRUD](https://sgrud.github.io) client libraries.
 *
 * @packageDocumentation
 */

export * from './src/http/http';
export * from './src/http/proxy';
export * from './src/http/transit';
export * from './src/kernel/kernel';
export * from './src/kernel/semver';
export * from './src/linker/factor';
export * from './src/linker/linker';
export * from './src/linker/target';
export * from './src/super/provide';
export * from './src/super/provider';
export * from './src/super/registry';
export * from './src/thread/spawn';
export * from './src/thread/thread';
export * from './src/thread/transfer';
export * from './src/typing/alias';
export * from './src/typing/assign';
export * from './src/typing/merge';
export * from './src/typing/mutable';
export * from './src/utility/assign';
export * from './src/utility/pluralize';
export * from './src/utility/singleton';
export * from './src/utility/symbols';
export * from './src/utility/type-of';
