import express from 'express';
import { cli } from './cli';

cli.command('universal')
  .describe('Runs SGRUD in universal (SSR) mode using `puppeteer`')
  .example('universal # Run with default options')
  .example('universal --host 0.0.0.0 # Listen on all IPs')
  .example('universal -H 192.168.0.10 -p 8080 # Listen on 192.168.0.10:8080')
  .option('-H, --host', 'Host to bind to', '127.0.0.1')
  .option('-p, --port', 'Port to bind to', '4000')
  .action((opts) => universal(opts));

/**
 * Runs SGRUD in universal (SSR) mode using
 * {@link https://www.npmjs.com/package/puppeteer|puppeteer}.
 *
 * ```text
 * Description
 *   Runs SGRUD in universal (SSR) mode using `puppeteer`
 *
 * Usage
 *   $ sgrud universal [options]
 *
 * Options
 *   -H, --host    Host to bind to  (default 127.0.0.1)
 *   -p, --port    Port to bind to  (default 4000)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud universal # Run with default options
 *   $ sgrud universal --host 0.0.0.0 # Listen on all IPs
 *   $ sgrud universal -H 192.168.0.10 -p 8080 # Listen on 192.168.0.10:8080
 * ```
 *
 * @param host - Host to bind to. (default: `'127.0.0.1'`)
 * @param port - Port to bind to. (default: `'4000'`)
 *
 * @example Run with default options.
 * ```js
 * require('@sgrud/bin');
 * sgrud.universal();
 * ```
 *
 * @example Listen on all IPs.
 * ```js
 * require('@sgrud/bin');
 * sgrud.universal({ host: '0.0.0.0' });
 * ```
 *
 * @example Listen on `192.168.0.10:8080`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.universal({ host: '192.168.0.10', port: '8080' });
 * ```
 */
export function universal({
  host = '127.0.0.1',
  port = '4000'
}: {
  host?: string;
  port?: string;
} = { }): void {
  const server = express();

  server.get('*', (request, response) => {
    response.send(`
      <html>
        <head>
          <title>${request.url}</title>
        </head>
        <body>
          <h1>Not Implemented!</h1>
        </body>
      </html>
    `);
  });

  server.listen(Number.parseInt(port), host, () => {
    const [_, g, b] = ['\x1b[0m', '\x1b[32m', '\x1b[34m'];
    console.log(g, '→', b, `http://${host}:${port}`, _);
  });
}
