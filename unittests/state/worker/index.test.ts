import { Store } from '@sgrud/state';
import express from 'express';
import { readFileSync } from 'fs-extra';
import { Server } from 'http';
import { join } from 'path';
import { Browser, launch, Page } from 'puppeteer-core';
import { Observable } from 'rxjs';

declare global {
  interface Window {
    global: { param: unknown };
    local: { param: unknown };
    setGlobal(...args: Store.Action<Global>): Observable<unknown>;
    setLocal(...args: Store.Action<Local>): Observable<unknown>;
  }
}

declare class Global extends Store<Global> {
  public setGlobal(param: unknown): Store.State<Global>;
}

declare class Local extends Store<Local> {
  public setLocal(param: unknown): Store.State<Local>;
}

describe('@sgrud/state/worker', () => {

  const html = readFileSync(join(__dirname, 'index.test.html')).toString();

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
      .use('/node_modules/@sgrud', express.static('./dist', {
        setHeaders: (res) => res.setHeader('service-worker-allowed', '/')
      }))
      .use('/node_modules', express.static('./node_modules', {
        index: ['index.js'],
        extensions: ['js'],
        fallthrough: false
      }))
      .use('/', (_, r) => r.send(html))
      .listen(location.port);
  }, 50000);

  describe('initializing the state machine within a browser', () => {
    it('correctly initializes the state machine', async() => {
      await pageOne.goto(location.href, { waitUntil: 'networkidle0' });
      await pageTwo.goto(location.href, { waitUntil: 'networkidle0' });
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      expect(await pageOne.evaluate(() => window.global.param)).toBeNull();
      expect(await pageTwo.evaluate(() => window.global.param)).toBeNull();

      expect(await pageOne.evaluate(() => window.local.param)).toBeNull();
      expect(await pageTwo.evaluate(() => window.local.param)).toBeNull();
    });
  });

  describe('dispatching local state changes', () => {
    it('correctly mutates the local browser state', async() => {
      await pageOne.evaluate(() => window.setLocal('setLocal', ['one']));
      await pageTwo.evaluate(() => window.setLocal('setLocal', ['two']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      expect(await pageOne.evaluate(() => window.local.param)).toBe('one');
      expect(await pageTwo.evaluate(() => window.local.param)).toBe('two');
    });
  });

  describe('dispatching global state changes', () => {
    it('correctly mutates the global browser state', async() => {
      await pageOne.evaluate(() => window.setGlobal('setGlobal', ['one']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));
      expect(await pageTwo.evaluate(() => window.global.param)).toBe('one');

      await pageTwo.evaluate(() => window.setGlobal('setGlobal', ['two']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));
      expect(await pageOne.evaluate(() => window.global.param)).toBe('two');
    });
  });

  describe('re-initializing the state machine within a browser', () => {
    it('correctly re-initializes the state machine', async() => {
      await pageOne.close();
      await pageTwo.evaluate(() => window.setGlobal('setGlobal', ['next']));
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      pageOne = await puppeteer.newPage();
      await pageOne.goto(location.href, { waitUntil: 'networkidle0' });
      await new Promise((resolve) => setTimeout(() => resolve(null), 500));

      expect(await pageOne.evaluate(() => window.global.param)).toBe('next');
      expect(await pageTwo.evaluate(() => window.global.param)).toBe('next');
    });
  });

});
