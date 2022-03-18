/**
 * `@sgrud/core` - The [SGRUD](https://github.com/sgrud/client) core module.
 *
 * The functions and classes found within this module represent the base upon
 * which the SGRUD client library is built. Therefore, most of the code provided
 * within this module does not aim to fulfill one specific high-level need, but
 * is intended to be used as low-level building block for downstream projects.
 * This practice is employed throughout the SGRUD client library, as all modules
 * depend on this core module. By providing the core functionality within this
 * singular module, all downstream SGRUD modules should be considered opt-in
 * functionality which may be used within projects building upon the SGRUD
 * client library.
 *
 * The different functions and classes implemented within this module can be
 * roughly categorized into the following functional aspects.
 *
 * - SGRUD Kernel
 *   - {@link Kernel}: an essential dependency loader
 *   - {@link semver}: best-effort `semver` matcher
 * - HTTP client
 *   - {@link HttpClient}: a simple `rxjs/ajax`-based HTTP client
 *   - {@link HttpProxy}: abstract base class for proxies/interceptors
 *   - {@link HttpState}: built-in HTTP proxy collecting request progress
 * - Super extensions
 *   - {@link Provide}: Provides the decorated constructor to extending classes
 *   - {@link Provider}: Mixin-style functional provider of base classes
 *   - {@link Registry}: extended `Map`, containing all providing constructors
 * - Dependency-linking
 *   - {@link Factor}: property decorator factoring a targeted constructor
 *   - {@link Linker}: extended `Map`, containing all linked instances
 *   - {@link Target}: class decorator linking the decorated constructor
 * - Threading tools
 *   - {@link Spawn}: property decorator to easily spawn a `WebWorker`
 *   - {@link Thread}: class decorator exposing the class inside a `WebWorker`
 * - Type helpers
 *   - {@link Assign}: assigns the own property types from a source to a target
 *   - {@link Merge}: type helper to convert union types to intersection types
 *   - {@link TypeOf}: strict type-assertion and runtime type-checking utility
 * - Miscellaneous utilities
 *   - {@link Singleton}: class decorator enforcing the singleton pattern
 *   - {@link pluralize}: pluralizes words of the English language
 *
 * @packageDocumentation
 */

export * from './src/http/client';
export * from './src/http/proxy';
export * from './src/http/state';
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
export * from './src/typing/assign';
export * from './src/typing/merge';
export * from './src/typing/type-of';
export * from './src/utility/pluralize';
export * from './src/utility/singleton';
