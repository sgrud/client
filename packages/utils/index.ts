/**
 * Utilities to be used with and internally used by `@sgrud`. The different
 * utilities can roughly be categorized into the following aspects:
 *
 * - HTTP request utilities
 *   - {@link HttpClient}: a simle `rxjs/ajax`-based HTTP client
 *   - {@link HttpProxy}: implementation-base for proxies/interceptors
 *   - {@link HttpState}: built-in HTTP proxy collecting request progress
 * - Dependency-linking utilities
 *   - {@link Linker}: overloaded map containing all linked instances
 *   - {@link Target}: class decorator linking the targeted constructor
 *   - {@link Uplink}: property decorator uplinking a linked constructor
 * - Threading utilities
 *   - {@link Spawn}: property decorator to easily spawn a `WebWorker`
 *   - {@link Thread}: class decorator exposing the class inside a `WebWorker`
 * - Type helper utilities
 *   - {@link TypeOf}: strict type-assertion and runtime type-checking utility
 * - Miscellaneous utilities
 *   - {@link pluralize}: pluralizes words of the English language
 *   - {@link Singleton}: class decorator enforcing the singleton pattern
 *
 * @packageDocumentation
 */

export * from './src/http/client';
export * from './src/http/proxy';
export * from './src/http/state';
export * from './src/linker/linker';
export * from './src/linker/target';
export * from './src/linker/uplink';
export * from './src/pluralize';
export * from './src/singleton';
export * from './src/thread/spawn';
export * from './src/thread/thread';
export * from './src/thread/transfer';
export * from './src/typing/assign';
export * from './src/typing/type-of';
