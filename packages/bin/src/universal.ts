import express from 'express';
import { existsSync, readFileSync } from 'fs-extra';
import { extname, join, resolve } from 'path';
import { launch } from 'puppeteer-core';
import { cli, _b, _g, __ } from './.cli';

cli.command('universal [entry]')
  .describe('Runs SGRUD in universal (SSR) mode using `puppeteer`')
  .example('universal # Run with default options')
  .example('universal --host 0.0.0.0 # Listen on all IPs')
  .example('universal -H 192.168.0.10 -p 4040 # Listen on 192.168.0.10:4040')
  .option('--chrome', 'Chrome executable path', '/usr/bin/chromium-browser')
  .option('--prefix', 'Use an alternative working directory', './')
  .option('-H, --host', 'Host/IP to bind to', '127.0.0.1')
  .option('-p, --port', 'Port to bind to', '4000')
  .action((entry, opts) => universal({ ...opts, entry }));

/**
 * Runs [SGRUD][] in **universal** (SSR) mode using [puppeteer][].
 *
 * ```text
 * Description
 *   Runs SGRUD in universal (SSR) mode using `puppeteer`
 *
 * Usage
 *   $ sgrud universal [entry] [options]
 *
 * Options
 *   --chrome      Chrome executable path  (default /usr/bin/chromium-browser)
 *   --prefix      Use an alternative working directory  (default ./)
 *   -H, --host    Host/IP to bind to  (default 127.0.0.1)
 *   -p, --port    Port to bind to  (default 4000)
 *   -h, --help    Displays this message
 *
 * Examples
 *   $ sgrud universal # Run with default options
 *   $ sgrud universal --host 0.0.0.0 # Listen on all IPs
 *   $ sgrud universal -H 192.168.0.10 -p 4040 # Listen on 192.168.0.10:4040
 * ```
 *
 * [puppeteer]: https://pptr.dev
 * [SGRUD]: https://sgrud.github.io
 *
 * @param options - Options object.
 * @returns Execution promise.
 *
 * @example
 * Run with default options:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.universal();
 * ```
 *
 * @example
 * Listen on all IPs:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.universal({
 *   host: '0.0.0.0'
 * });
 * ```
 *
 * @example
 * Listen on `192.168.0.10:4040`:
 * ```js
 * require('@sgrud/bin');
 *
 * sgrud.bin.universal({
 *   host: '192.168.0.10',
 *   port: '4040'
 * });
 * ```
 */
export async function universal({
  chrome = '/usr/bin/chromium-browser',
  entry = 'index.html',
  host = '127.0.0.1',
  port = '4000',
  prefix = './'
}: {

  /**
   * Chrome executable path.
   *
   * @defaultValue `'/usr/bin/chromium-browser'`
   */
  chrome?: string;

  /**
   * HTML document (relative to `prefix`).
   *
   * @defaultValue `'index.html'`
   */
  entry?: string;

  /**
   * Host/IP to bind to.
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

  /**
   * Use an alternative working directory.
   *
   * @defaultValue `'./'`
   */
  prefix?: string;

} = { }): Promise<void> {
  const app = express();
  const caches = new Map<string, Promise<string>>();
  const puppeteer = await launch({
    executablePath: chrome,
    args: [
      '--disable-setuid-sandbox',
      '--no-sandbox'
    ]
  });

  app.use('/', express.static(prefix, {
    index: ['index.js'],
    extensions: ['js'],
    fallthrough: false
  }));

  app.use(async(
    _: Record<string, any>,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    let cache = caches.get(req.url);

    if (!cache || req.headers.pragma === 'no-cache') {
      cache = puppeteer.newPage().then(async(page) => {
        await page.setRequestInterception(true);

        page.on('domcontentloaded', () => void page.evaluate(() => {
          delete (Document.prototype as any).adoptedStyleSheets;
          document.body.dataset.universal = Date.now().toString();
        }));

        page.on('request', (event) => {
          const initiator = event.initiator().type;
          const type = event.resourceType();
          const url = new URL(event.url());

          if (type === 'document') {
            return void event.respond({
              status: 200,
              contentType: 'text/html',
              body: readFileSync(resolve(prefix, entry))
            });
          } else if ((
            initiator === 'script' && type === 'fetch'
          ) || (
            type === 'script' && url.protocol !== 'data:'
          )) {
            const file = join(prefix, url.pathname + (
              extname(url.pathname) ? '' : '.js'
            ));

            if (existsSync(file)) {
              return void event.respond({
                status: 200,
                contentType: 'application/javascript',
                body: readFileSync(file)
              });
            }
          } else if ((
            initiator === 'preflight' || type === 'xhr'
          ) || (
            type === 'script' && url.protocol === 'data:'
          )) {
            return void event.continue();
          }

          return void event.abort();
        });

        return page;
      }).then(async(page) => {
        const url = new URL(req.url, `${req.protocol}://${req.headers.host!}`);
        await page.goto(url.href, { waitUntil: 'networkidle0' });

        return page;
      }).then(async(page) => {
        const html = await page.$eval('html', (e: any) => e.getInnerHTML());
        await page.close();

        return html;
      });

      caches.set(req.url, cache);
    }

    try {
      return res.status(200).send(await cache);
    } catch (error) {
      return next(error);
    }
  });

  app.listen(Number.parseInt(port), host, () => {
    console.log(
      _g, '[universal]',
      _b, entry,
      _g, '→',
      _b, `http://${host}:${port}`,
      __
    );
  });
}
