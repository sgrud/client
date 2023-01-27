import { Store } from '@sgrud/state';
import express from 'express';
import { Server } from 'http';
import { join } from 'path';
import { Browser, launch, Page } from 'puppeteer-core';
import { Observable } from 'rxjs';
import { setImmediate } from 'timers';

declare class Transient extends Store<Transient> {
  public transiently(param: unknown): Promise<Store.State<this>>;
}

declare class Universal extends Store<Universal> {
  public universally(param: unknown): Promise<Store.State<this>>;
}

declare class Versatile extends Store<Versatile> {
  public versatilely(param: unknown): Promise<Store.State<this>>;
}

declare global {
  interface Window {
    transient: { param: unknown };
    universal: { param: unknown };
    versatile: { param: unknown };
    transiently(...args: Store.Action<Transient>): Observable<unknown>;
    universally(...args: Store.Action<Universal>): Observable<unknown>;
    versatilely(...args: Store.Action<Versatile>): Observable<unknown>;
  }
}

globalThis.setImmediate = setImmediate;

describe('@sgrud/state/worker', () => {

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
      .use('/api/sgrud/v1/insmod', (_, r) => r.send({ }))
      .use('/fetch', (_, r) => r.send({ param: null }))
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
  }, 50000);

  describe('initializing the state machine within a browser', () => {
    it('correctly initializes the state machine', async() => {
      await pageOne.goto(location.href, { waitUntil: 'networkidle0' });
      await pageTwo.goto(location.href, { waitUntil: 'networkidle0' });
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      expect(await pageOne.evaluate(() => window.transient.param)).toBeNull();
      expect(await pageTwo.evaluate(() => window.transient.param)).toBeNull();

      expect(await pageOne.evaluate(() => window.universal.param)).toBeNull();
      expect(await pageTwo.evaluate(() => window.universal.param)).toBeNull();
    });
  });

  describe('dispatching transient state changes', () => {
    it('correctly mutates the transient browser state', async() => {
      await pageOne.evaluate(() => window.transiently('transiently', ['one']));
      await pageTwo.evaluate(() => window.transiently('transiently', ['two']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      expect(await pageOne.evaluate(() => window.transient.param)).toBe('one');
      expect(await pageTwo.evaluate(() => window.transient.param)).toBe('two');
    });
  });

  describe('dispatching universal state changes', () => {
    it('correctly mutates the universal browser state', async() => {
      await pageOne.evaluate(() => window.universally('universally', ['one']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));
      expect(await pageTwo.evaluate(() => window.universal.param)).toBe('one');

      await pageTwo.evaluate(() => window.universally('universally', ['two']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));
      expect(await pageOne.evaluate(() => window.universal.param)).toBe('two');
    });
  });

  describe('dispatching versatile state changes', () => {
    it('correctly mutates the browser state', async() => {
      await pageOne.evaluate(() => window.versatilely('versatilely', ['all']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      expect(await pageOne.evaluate(() => window.transient.param)).toBe('all');
      expect(await pageOne.evaluate(() => window.universal.param)).toBe('all');

      expect(await pageTwo.evaluate(() => window.transient.param)).toBe('two');
      expect(await pageTwo.evaluate(() => window.universal.param)).toBe('all');

      expect(await pageOne.evaluate(() => window.versatile.param)).toBe(null);
    });
  });

  describe('re-initializing the state machine within a browser', () => {
    it('correctly re-initializes the state machine', async() => {
      await pageOne.close();
      await pageTwo.evaluate(() => window.universally('universally', ['next']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      pageOne = await puppeteer.newPage();
      await pageOne.goto(location.href, { waitUntil: 'networkidle0' });
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      expect(await pageOne.evaluate(() => window.universal.param)).toBe('next');
      expect(await pageTwo.evaluate(() => window.universal.param)).toBe('next');
    });
  });

});
