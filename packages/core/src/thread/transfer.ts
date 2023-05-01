import { expose, ProxyMarked, transferHandlers, wrap } from 'comlink';
import { TypeOf } from '../utility/type-of';

if (TypeOf.process(globalThis.process)) {
  const nodeEndpoint = require('comlink/dist/umd/node-adapter');
  const { MessageChannel } = require('worker_threads');

  /**
   * Alteration of the {@link transferHandlers}, allowing values to be proxied
   * between endpoints under NodeJS.
   *
   * @remarks https://github.com/GoogleChromeLabs/comlink/issues/313
   */
  transferHandlers.set('proxy', {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    canHandle: transferHandlers.get('proxy')!.canHandle,
    deserialize: (value: MessagePort) => {
      return wrap(nodeEndpoint(value));
    },
    serialize: (value: ProxyMarked) => {
      const { port1, port2 } = new MessageChannel();
      expose(value, nodeEndpoint(port1));
      return [port2, [port2]];
    }
  });
}
