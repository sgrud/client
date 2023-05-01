import express from 'express';
import { Server } from 'http';
import { join } from 'path';
import { Browser, launch, Page } from 'puppeteer-core';
import { Worker } from 'worker_threads';

/*
 * Declarations
 */

declare const window: Window & typeof globalThis & {
  readonly unittest: Promise<unknown>;
};

describe('@sgrud/bus/worker', () => {

  /*
   * Fixtures
   */

  let page: Page;
  let puppeteer: Browser;
  let server: Server;

  afterAll(async() => {
    await puppeteer.close();
    server.close();
  });

  beforeAll(async() => {
    page = await (puppeteer = await launch({
      executablePath: '/usr/bin/chromium-browser',
      args: ['--disable-setuid-sandbox', '--no-sandbox']
    })).newPage();

    server = express()
      .use('/node_modules/@sgrud', express.static('./dist'))
      .use('/node_modules', express.static('./node_modules', {
        index: ['index.js'],
        extensions: ['js'],
        fallthrough: false
      }))
      .use('/', (_, r) => r.sendFile(join(__dirname, 'index.test.html')))
      .listen(location.port);
  }, 60000);

  /*
   * Unittests
   */

  describe('requiring the module as worker thread', () => {
    const worker = new Worker(require.resolve('@sgrud/bus/worker'));

    it('creates a worker thread', () => {
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('initializing the module as browser worker', () => {
    it('correctly initializes the module as browser worker', async() => {
      await page.goto(location.href, { waitUntil: 'networkidle0' });

      await expect(page.evaluate(() => {
        return window.unittest;
      })).resolves.toMatchObject({
        handle: 'sgrud.test.bus.stream',
        kind: 'C'
      });
    });
  });

});
