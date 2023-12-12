import { indexedDB } from 'fake-indexeddb';
import { clearImmediate, setImmediate } from 'timers';
import { MessageChannel } from 'worker_threads';

/*
 * Declarations
 */

declare global {
  const globalThis: typeof global & Record<string, unknown>;

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface HTMLElementTagNameMap {
    [key: `${string}-${string}`]: HTMLElement;
  }

  namespace sgrud.state.effects {
    function test(): void;
  }
}

/*
 * Mocks
 */

globalThis.indexedDB = indexedDB;
globalThis.MessageChannel = MessageChannel as any;
globalThis.structuredClone = (ignored) => ignored;

globalThis.clearImmediate = clearImmediate;
globalThis.setImmediate = setImmediate;

jest.mock('comlink', () => ({
  __esModule: true, ...jest.requireActual('comlink')
}));

/*
 * Proxies
 */

globalThis.HTMLElement = new Proxy(HTMLElement, {
  apply: (...args) => Reflect.construct(args[0], args[2], args[1].constructor)
});

globalThis.HTMLAnchorElement = new Proxy(HTMLAnchorElement, {
  apply: (...args) => Reflect.construct(args[0], args[2], args[1].constructor)
});

globalThis.HTMLSlotElement = new Proxy(HTMLSlotElement, {
  apply: (...args) => Reflect.construct(args[0], args[2], args[1].constructor)
});
