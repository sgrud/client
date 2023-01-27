import { BusValue } from '@sgrud/bus';
import express from 'express';
import { Server } from 'http';
import { join } from 'path';
import { Browser, launch, Page } from 'puppeteer-core';
import { setImmediate } from 'timers';
import { Worker } from 'worker_threads';

declare global {
  interface Window {
    busValue: BusValue<string>;
  }
}

globalThis.setImmediate = setImmediate;

describe('@sgrud/bus/worker', () => {

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
      .use('/api/sgrud/v1/insmod', (_, r) => r.send({ }))
      .use('/node_modules/@sgrud', express.static('./dist'))
      .use('/node_modules', express.static('./node_modules', {
        index: ['index.js'],
        extensions: ['js'],
        fallthrough: false
      }))
      .use('/', (_, r) => r.sendFile(join(__dirname, 'index.test.html')))
      .listen(location.port);
  }, 50000);

  describe('requiring the module as worker thread', () => {
    const worker = new Worker(require.resolve('@sgrud/bus/worker'));

    it('creates a worker thread', () => {
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('requiring the module as browser worker', () => {
    it('creates a browser worker', async() => {
      await page.goto(location.href, { waitUntil: 'networkidle0' });
      const value = await page.evaluate(() => window.busValue);

      expect(value).toMatchObject({
        handle: 'sgrud.test.bus',
        value: '@sgrud/bus/worker'
      });
    });
  });

});
