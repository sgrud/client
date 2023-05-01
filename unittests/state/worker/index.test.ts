import express from 'express';
import { Server } from 'http';
import { join } from 'path';
import { Browser, launch, Page } from 'puppeteer-core';
import { Worker } from 'worker_threads';

/*
 * Declarations
 */

declare const window: Window & typeof globalThis & {
  unittest: Promise<unknown>;
  transient: { state: unknown; action(...args: unknown[]): Promise<unknown> };
  universal: { state: unknown; action(...args: unknown[]): Promise<unknown> };
  versatile: { state: unknown; action(...args: unknown[]): Promise<unknown> };
};

describe('@sgrud/state/worker', () => {

  /*
   * Fixtures
   */

  let pageOne: Page;
  let pageTwo: Page;
  let puppeteer: Browser;
  let server: Server;

  afterAll(async() => {
    await puppeteer.close();
    server.close();
  });

  beforeAll(async() => {
    puppeteer = await launch({
      executablePath: '/usr/bin/chromium-browser',
      args: ['--disable-setuid-sandbox', '--no-sandbox']
    });

    pageOne = await puppeteer.newPage();
    pageTwo = await puppeteer.newPage();

    server = express()
      .use('/fetch', (_, r) => r.send('fetch'))
      .use('/node_modules/@sgrud', express.static('./dist', {
        setHeaders: (res) => res.setHeader('service-worker-allowed', '/')
      }))
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
    const worker = new Worker(require.resolve('@sgrud/state/worker'));

    it('creates a worker thread', () => {
      expect(worker).toBeInstanceOf(Worker);
    });
  });

  describe('initializing the module as service worker', () => {
    it('correctly initializes the module as service worker', async() => {
      await pageOne.goto(location.href, { waitUntil: 'networkidle0' });
      await pageTwo.goto(location.href, { waitUntil: 'networkidle0' });

      await pageOne.evaluate(() => window.unittest);
      await pageTwo.evaluate(() => window.unittest);

      await expect(pageOne.evaluate(() => ({
        transient: window.transient.state,
        universal: window.universal.state,
        versatile: window.versatile.state
      }))).resolves.toMatchObject({
        transient: { property: 'transient' },
        universal: { property: 'universal' },
        versatile: { property: 'versatile' }
      });

      await expect(pageTwo.evaluate(() => ({
        transient: window.transient.state,
        universal: window.universal.state,
        versatile: window.versatile.state
      }))).resolves.toMatchObject({
        transient: { property: 'transient' },
        universal: { property: 'universal' },
        versatile: { property: 'versatile' }
      });
    });
  });

  describe('dispatching transient state changes', () => {
    it('correctly mutates the transient state', async() => {
      await expect(pageOne.evaluate(() => {
        return window.transient.action('action', [
          'one'
        ]);
      })).resolves.toMatchObject({
        property: 'one'
      });

      await expect(pageTwo.evaluate(() => {
        return window.transient.action('action', [
          'two'
        ]);
      })).resolves.toMatchObject({
        property: 'two'
      });

      await expect(pageOne.evaluate(() => ({
        transient: window.transient.state
      }))).resolves.toMatchObject({
        transient: { property: 'one' }
      });

      await expect(pageTwo.evaluate(() => ({
        transient: window.transient.state
      }))).resolves.toMatchObject({
        transient: { property: 'two' }
      });
    });
  });

  describe('dispatching universal state changes', () => {
    it('correctly mutates the universal state', async() => {
      await expect(pageOne.evaluate(() => {
        return window.universal.action('action', [
          'one'
        ]);
      })).resolves.toMatchObject({
        property: 'one'
      });

      await expect(pageTwo.evaluate(() => ({
        universal: window.universal.state
      }))).resolves.toMatchObject({
        universal: { property: 'one' }
      });

      await expect(pageTwo.evaluate(() => {
        return window.universal.action('action', [
          'two'
        ]);
      })).resolves.toMatchObject({
        property: 'two'
      });

      await expect(pageOne.evaluate(() => ({
        universal: window.universal.state
      }))).resolves.toMatchObject({
        universal: { property: 'two' }
      });
    });
  });

  describe('re-initializing the module as service worker', () => {
    it('correctly re-initializing the module as service worker', async() => {
      await expect(pageOne.evaluate(() => {
        return window.universal.action('action', [
          'next'
        ]);
      })).resolves.toMatchObject({
        property: 'next'
      });

      pageTwo = await pageTwo.close().then(() => puppeteer.newPage());
      await pageTwo.goto(location.href, { waitUntil: 'networkidle0' });
      await pageTwo.evaluate(() => window.unittest);

      await expect(pageOne.evaluate(() => ({
        universal: window.universal.state
      }))).resolves.toMatchObject({
        universal: { property: 'next' }
      });

      await expect(pageTwo.evaluate(() => ({
        universal: window.universal.state
      }))).resolves.toMatchObject({
        universal: { property: 'next' }
      });
    });
  });

  describe('dispatching versatile state changes', () => {
    it('correctly mutates the state', async() => {
      await expect(pageOne.evaluate(() => {
        return window.versatile.action('apply', [
          'sgrud.test.state.universal',
          'action',
          ['done']
        ]);
      })).resolves.toMatchObject({
        property: 'done'
      });

      await expect(pageOne.evaluate(() => {
        return window.versatile.action('fetch', [
          '/fetch'
        ]);
      })).resolves.toMatchObject({
        property: 'fetch'
      });

      await expect(pageTwo.evaluate(() => {
        return window.versatile.action('state', [
          'sgrud.test.state.universal'
        ]);
      })).resolves.toMatchObject({
        property: 'done'
      });
    });
  });

});
