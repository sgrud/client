import { Kernel } from '@sgrud/core';
import express from 'express';
import { Server } from 'http';
import { catchError, from, interval, map, of, takeUntil } from 'rxjs';

describe('@sgrud/core/kernel/kernel', () => {

  /*
   * Fixtures
   */

  let server: Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/node_modules/depmod/package.json', (_, r) => r.send(depmod))
    .use('/node_modules/dirmod/package.json', (_, r) => r.send(dirmod))
    .use('/node_modules/submod/package.json', (_, r) => r.send(submod))
    .listen(location.port));

  afterEach(() => [append, open, select, send].forEach((i) => i.mockClear()));
  const append = jest.spyOn(document.head, 'appendChild');
  const select = jest.spyOn(document, 'querySelectorAll');
  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');

  jest.mock('depmod', () => depmod, { virtual: true });
  jest.mock('submod', () => submod, { virtual: true });
  jest.mock('usrmod.esmod', () => usrmod.esmod, { virtual: true });
  jest.mock('usrmod.unpkg', () => usrmod.esmod, { virtual: true });

  function imports(records: unknown): HTMLScriptElement {
    return Object.assign(document.createElement('script'), {
      innerHTML: JSON.stringify({ imports: records }),
      type: 'importmap-shim'
    });
  }

  function preload(records: unknown): HTMLLinkElement {
    return Object.assign(document.createElement('link'), records, {
      rel: 'modulepreload-shim'
    });
  }

  function scripts(records: unknown): HTMLScriptElement {
    return Object.assign(document.createElement('script'), records, {
      type: 'text/javascript'
    });
  }

  document.head.innerHTML = `
    <script type="importmap-shim">
      {
        "imports": {
          "module": "/pathname"
        }
      }
    </script>
  `;

  /*
   * Variables
   */

  const webmod = {
    name: 'webmod',
    exports: {
      webOne: './webOne.esmod.js',
      webTwo: './webTwo.esmod.js'
    },
    unpkg: [
      './webOne.unpkg.js',
      './webTwo.unpkg.js'
    ]
  } as const;

  const depmod = {
    name: 'depmod',
    version: '0.1.0',
    exports: './depmod.esmod.js',
    unpkg: './depmod.unpkg.js',
    sgrudDependencies: {
      dirmod: '/node_modules/dirmod'
    },
    webDependencies: {
      webmod
    },
    digest: {
      exports: 'sha512-depmod-esmod',
      unpkg: 'sha512-depmod-unpkg'
    }
  } as const;

  const dirmod = {
    name: 'dirmod',
    version: '0.0.5',
    exports: './dirmod.esmod.js',
    unpkg: './dirmod.unpkg.js',
    sgrudDependencies: {
      submod: '*'
    }
  } as const;

  const submod = {
    name: 'submod',
    version: '0.0.5',
    exports: './submod.esmod.js',
    unpkg: './submod.unpkg.js'
  } as const;

  const usrmod = {
    esmod: {
      name: 'usrmod.esmod',
      version: '0.0.1',
      exports: './usrmod.esmod.js',
      webDependencies: {
        webmod: {
          exports: {
            webmod: './webmod.esmod.js'
          }
        }
      },
      sgrudDependencies: {
        depmod: '*'
      },
      digest: {
        exports: 'sha512-usrmod-esmod'
      }
    },
    unpkg: {
      name: 'usrmod.unpkg',
      version: '0.0.1',
      unpkg: './usrmod.unpkg.js',
      webDependencies: {
        webmod: {
          unpkg: [
            './webmod.unpkg.js'
          ]
        }
      },
      sgrudDependencies: {
        depmod: '*'
      },
      digest: {
        unpkg: 'sha512-usrmod-unpkg'
      }
    }
  } as const;

  /*
   * Unittests
   */

  describe('constructing an instance', () => {
    const kernel = new Kernel();

    it('collects importmaps from the document', () => {
      expect(select).toBeCalled();
    });

    it('returns the singleton instance', () => {
      expect(kernel).toBe(new Kernel());
    });
  });

  describe('requiring a module and executing it for the first time', () => {
    const kernel = new Kernel();

    it('calls insmod on the module and its dependencies', (done) => {
      const changes = from(kernel).pipe(map((next, index) => {
        switch (index) {
          case 0: expect(next).toMatchObject(submod); break;
          case 1: expect(next).toMatchObject(dirmod); break;
          case 2: expect(next).toMatchObject(depmod); break;
        }
      })).subscribe({
        error: done
      });

      kernel.require('depmod').pipe(map((next) => {
        changes.unsubscribe();
        expect(next).toMatchObject(depmod);
        expect(send).toBeCalledTimes(open.mock.calls.length);

        expect(append.mock.calls).toStrictEqual([
          [preload({
            href: `/node_modules/${submod.name}/${submod.exports}`
          })],
          [imports({
            submod: `/node_modules/${submod.name}/${submod.exports}`
          })],
          [preload({
            href: `/node_modules/${dirmod.name}/${dirmod.exports}`
          })],
          [imports({
            dirmod: `/node_modules/${dirmod.name}/${dirmod.exports}`
          })],
          [preload({
            href: `/node_modules/${depmod.name}/${depmod.exports}`
          })],
          [imports({
            depmod: `/node_modules/${depmod.name}/${depmod.exports}`,
            webOne: `/node_modules/${webmod.name}/${webmod.exports.webOne}`,
            webTwo: `/node_modules/${webmod.name}/${webmod.exports.webTwo}`
          })]
        ]);

        expect(open.mock.calls).toStrictEqual([
          ['GET', `/node_modules/${depmod.name}/package.json`, true],
          ['GET', `/node_modules/${dirmod.name}/package.json`, true],
          ['GET', `/node_modules/${submod.name}/package.json`, true]
        ]);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('requiring a module and executing it again', () => {
    const require = new Kernel().require(`/node_modules/${depmod.name}`);

    it('does not call insmod on the module and its dependencies', (done) => {
      require.pipe(map((next) => {
        expect(next).toMatchObject(depmod);
        expect(append).not.toBeCalled();
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('running in a legacy environment', () => {
    const module = { ...dirmod, name: 'oldmod' } as Kernel.Module;
    const insmod = new Kernel().insmod(module);

    it('calls insmod on the legacy modules', (done) => {
      globalThis.sgrud = undefined! || true;

      interval(250).pipe(takeUntil(insmod)).subscribe(() => {
        append.mock.calls.forEach(([i]: [any]) => i.onload!());
      });

      insmod.pipe(map((next) => {
        globalThis.sgrud = undefined!;
        expect(next).toMatchObject(module);
        expect(append).toBeCalledWith(scripts({
          src: `/node_modules/${module.name}/${module.unpkg!}`
        }));
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe.each(Object.keys(usrmod))('calling insmod on a %s module', (key) => {
    const module = usrmod[key as keyof typeof usrmod] as Kernel.Module;
    const insmod = new Kernel().insmod(module, undefined, true);

    it('inserts the module', (done) => {
      globalThis.sgrud = undefined! || key === 'unpkg';

      interval(250).pipe(takeUntil(insmod)).subscribe(() => {
        append.mock.calls.forEach(([i]: [any]) => i.onload!());
      });

      insmod.pipe(map((next) => {
        globalThis.sgrud = undefined!;
        expect(next).toMatchObject(module);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling insmod on a faulty module', () => {
    const module = { name: 'nonexistent' } as Kernel.Module;
    const insmod = new Kernel().insmod(module).pipe(
      catchError((error) => of(error))
    );

    it('throws an error', (done) => {
      insmod.pipe(map((next) => {
        expect(next).toBeInstanceOf(ReferenceError);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling insmod on a module with a too high version', () => {
    const module = { ...dirmod, name: 'maxver' } as Kernel.Module;
    const insmod = new Kernel().insmod(module).pipe(
      catchError((error) => of(error))
    );

    it('throws an error', (done) => {
      module.sgrudDependencies!.submod = '0.1.0';

      insmod.pipe(map((next) => {
        expect(next).toBeInstanceOf(RangeError);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('calling insmod on a module with a too low version', () => {
    const module = { ...dirmod, name: 'minver' } as Kernel.Module;
    const insmod = new Kernel().insmod(module).pipe(
      catchError((error) => of(error))
    );

    it('throws an error', (done) => {
      module.sgrudDependencies!.submod = '0.0.1';

      insmod.pipe(map((next) => {
        expect(next).toBeInstanceOf(RangeError);
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

  describe('firing the script onerror handler', () => {
    const module = { ...submod, name: 'module' } as Kernel.Module;
    const insmod = new Kernel().insmod(module).pipe(
      catchError((error) => of(error))
    );

    it('emits the error to the observer', (done) => {
      globalThis.sgrud = undefined! || true;

      interval(250).pipe(takeUntil(insmod)).subscribe(() => {
        append.mock.calls.forEach(([i]: [any]) => i.onerror!());
      });

      insmod.pipe(map((next) => {
        globalThis.sgrud = undefined!;
        expect(next).toBeUndefined();
        expect(append).toBeCalledWith(scripts({
          src: `/node_modules/${module.name}/${module.unpkg!}`
        }));
      })).subscribe({
        complete: done,
        error: done
      });
    });
  });

});
