import { Kernel } from '@sgrud/core';
import express from 'express';
import { readFileSync } from 'fs-extra';
import { Server } from 'http';
import { join } from 'path';
import { Browser, launch, Page } from 'puppeteer-core';
import { Worker } from 'worker_threads';

describe('@sgrud/bus/worker', () => {

  const html = readFileSync(join(__dirname, 'index.test.html')).toString();
  const insmod = { name: 'insmod', version: '0.0.0' } as Kernel.Module;

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
      .use('/api/sgrud/v1/insmod', (_, r) => r.send(insmod))
      .use('/node_modules/@sgrud', express.static('./dist'))
      .use('/node_modules', express.static('./node_modules', {
        index: ['index.js'],
        extensions: ['js'],
        fallthrough: false
      }))
      .use('/', (_, r) => r.send(html))
      .listen(location.port);
  });

  describe('requiring the module as worker thread', () => {
    const worker = new Worker(require.resolve('@sgrud/bus/worker'));

    it('creates a worker thread', () => {
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('requiring the module as browser worker', () => {
    it('creates a browser worker', async() => {
      await page.goto(location.href, { waitUntil: 'networkidle0' });
      const value = await page.evaluate(() => (window as any).bus);

      expect(value).toMatchObject({
        handle: 'sgrud.test.bus.worker',
        value: '@sgrud/bus/worker'
      });
    });
  });

});
