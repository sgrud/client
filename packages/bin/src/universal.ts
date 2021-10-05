import express from 'express';
import { join, resolve } from 'path';
import { cli } from './cli';

cli.command('universal')
  .describe('Runs SGRUD in universal (SSR) mode using `puppeteer`')
  .example('universal # Run with default options')
  .example('universal --host 0.0.0.0 # Listen on all IPs')
  .example('universal -H 192.168.0.10 -p 8080 # Listen on 192.168.0.10:8080')
  .option('--cwd', 'Use an alternative working directory', './')
  .option('-H, --host', 'Host to bind to', '127.0.0.1')
  .option('-p, --port', 'Port to bind to', '4000')
  .action((opts) => universal({ ...opts }));

/**
 * Runs SGRUD in universal (SSR) mode using
 * [puppeteer](https://www.npmjs.com/package/puppeteer).
 *
 * ```text
 * Description
 *   Runs SGRUD in universal (SSR) mode using `puppeteer`
 *
 * Usage
 *   $ sgrud universal [options]
 *
 * Options
 *   --cwd         Use an alternative working directory  (default ./)
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
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example Run with default options.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.universal();
 * ```
 *
 * @example Listen on all IPs.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.universal({ host: '0.0.0.0' });
 * ```
 *
 * @example Listen on `192.168.0.10:8080`.
 * ```js
 * require('@sgrud/bin');
 * sgrud.bin.universal({ host: '192.168.0.10', port: '8080' });
 * ```
 */
export async function universal({
  cwd = './',
  host = '127.0.0.1',
  port = '4000'
}: {

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  cwd?: string;

  /**
   * Host to bind to.
   *
   * @defaultValue `'127.0.0.1'`
   */
  host?: string;

  /**
   * Port to bind to.
   *
   * @defaultValue `'4000'`
   */
  port?: string;

} = { }): Promise<void> {
  const server = express();

  server.get('*', (request, response) => {
    response.send(`
      <html>
        <head>
          <title>${request.url}</title>
        </head>
        <body>
          <h1>Not Implemented!</h1>
          <small>${resolve(join(process.cwd(), cwd))}</small>
        </body>
      </html>
    `);
  });

  server.listen(Number.parseInt(port), host, () => {
    const [_, g, b] = ['\x1b[0m', '\x1b[32m', '\x1b[34m'];
    console.log(g, '→', b, `http://${host}:${port}`, _);
  });
}
