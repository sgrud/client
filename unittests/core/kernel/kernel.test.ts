import { Kernel } from '@sgrud/core';
import express from 'express';
import { Server } from 'http';
import { catchError, EMPTY, from, of, timeout } from 'rxjs';

declare global {
  namespace globalThis {
    // eslint-disable-next-line no-var
    var sgrud: boolean | undefined;
  }
}

describe('@sgrud/core/kernel/kernel', () => {

  jest.mock('depmod', () => depmod, { virtual: true });
  jest.mock('submod', () => submod, { virtual: true });
  jest.mock('usrmod.esmod', () => usrmod.esmod, { virtual: true });
  jest.mock('usrmod.unpkg', () => usrmod.esmod, { virtual: true });

  let server = null! as Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/api/sgrud/v1/insmod', (_, r) => r.send(depmod))
    .use('/node_modules/dirmod/package.json', (_, r) => r.send(dirmod))
    .use('/node_modules/submod/package.json', (_, r) => r.send(submod))
    .use('/', (_, r) => r.send())
    .listen(58080));

  const append = jest.spyOn(document.head, 'appendChild');
  const select = jest.spyOn(document, 'querySelectorAll');
  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');
  afterEach(() => [append, select, open, send].forEach((i) => i.mockClear()));

  document.head.innerHTML = `
    <script type="importmap-shim">
      {
        "imports": {
          "module": "/pathname"
        }
      }
    </script>
  `;

  const depmod = {
    default: null,
    name: 'depmod',
    version: '0.1.0',
    exports: './depmod.esmod.js',
    unpkg: './depmod.unpkg.js',
    sgrudDependencies: {
      dirmod: '/node_modules/dirmod'
    },
    webDependencies: {
      webmod: {
        exports: {
          webmodOne: './webmodOne.esmod.js',
          webmodTwo: './webmodTwo.esmod.js'
        },
        unpkg: [
          './webmodOne.unpkg.js',
          './webmodTwo.unpkg.js'
        ]
      }
    },
    digest: {
      exports: 'sha512-depmod-exports',
      unpkg: 'sha512-depmod-unpkg'
    }
  } as Kernel.Module;

  const dirmod = {
    name: 'dirmod',
    version: '0.0.5',
    exports: './dirmod.esmod.js',
    unpkg: './dirmod.unpkg.js',
    sgrudDependencies: {
      submod: '*'
    }
  } as Kernel.Module;

  const submod = {
    name: 'submod',
    version: '0.0.5',
    exports: './submod.esmod.js',
    unpkg: './submod.unpkg.js'
  } as Kernel.Module;

  const usrmod = {
    esmod: {
      __esModule: true,
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
        exports: 'sha512-usrmod-exports'
      }
    } as Kernel.Module,
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
    } as Kernel.Module
  };

  describe('instantiating a kernel', () => {
    const kernel = new Kernel();

    const appended = [
      Object.assign(document.createElement('script'), {
        innerHTML: JSON.stringify({
          imports: {
            submod: [
              location.origin,
              'node_modules',
              submod.name,
              submod.exports
            ].join('/')
          }
        }),
        type: 'importmap-shim'
      }),
      Object.assign(document.createElement('link'), {
        href: [
          location.origin,
          'node_modules',
          submod.name,
          submod.exports
        ].join('/'),
        rel: 'modulepreload-shim'
      }),
      Object.assign(document.createElement('script'), {
        innerHTML: JSON.stringify({
          imports: {
            dirmod: [
              '/node_modules',
              dirmod.name,
              dirmod.exports
            ].join('/')
          }
        }),
        type: 'importmap-shim'
      }),
      Object.assign(document.createElement('link'), {
        href: [
          '/node_modules',
          dirmod.name,
          dirmod.exports
        ].join('/'),
        rel: 'modulepreload-shim'
      }),
      Object.assign(document.createElement('script'), {
        innerHTML: JSON.stringify({
          imports: {
            depmod: [
              location.origin,
              'node_modules',
              depmod.name,
              depmod.exports
            ].join('/'),
            webmodOne: [
              location.origin,
              'node_modules',
              Object.keys(depmod.webDependencies!)[0],
              depmod.webDependencies!.webmod.exports!.webmodOne
            ].join('/'),
            webmodTwo: [
              location.origin,
              'node_modules',
              Object.keys(depmod.webDependencies!)[0],
              depmod.webDependencies!.webmod.exports!.webmodTwo
            ].join('/')
          }
        }),
        type: 'importmap-shim'
      })
    ];

    const opened = [
      [
        'GET',
        [
          location.origin,
          'api/sgrud/v1/insmod'
        ].join('/'),
        true
      ],
      [
        'GET',
        [
          '/node_modules',
          dirmod.name,
          'package.json'
        ].join('/'),
        true
      ],
      [
        'GET',
        [
          location.origin,
          'node_modules',
          submod.name,
          'package.json'
        ].join('/'),
        true
      ]
    ];

    it('calls insmod on the modules', (done) => {
      let counter = 0;

      const subscription = from(kernel).pipe(
        timeout(250),
        catchError(() => EMPTY)
      ).subscribe((next) => {
        switch (counter++) {
          case 0: expect(next).toMatchObject(submod); break;
          case 1: expect(next).toMatchObject(dirmod); break;
          case 2: expect(next).toMatchObject(depmod); break;
        }

        expect(select).toHaveBeenCalled();
        expect(send).toHaveBeenCalledTimes(opened.length);

        appended.slice(0, counter + 1).forEach((n, i) => {
          expect(append).toHaveBeenNthCalledWith(++i, n);
        });

        opened.forEach((n, i) => {
          expect(open).toHaveBeenNthCalledWith(++i, ...n);
        });
      });

      subscription.add(done);
    });

    it('returns the singleton kernel', () => {
      expect(kernel).toBe(new Kernel());
    });
  });

  describe('instantiating another kernel', () => {
    const kernel = new Kernel();

    it('returns the singleton kernel again', () => {
      expect(kernel).toBe(new Kernel());
    });
  });

  describe('running in a legacy environment', () => {
    const kernel = new Kernel();
    const module = { ...dirmod, name: 'oldmod' };

    const appended = [
      Object.assign(document.createElement('script'), {
        src: [
          location.origin,
          'node_modules',
          module.name,
          module.unpkg
        ].join('/'),
        type: 'text/javascript'
      })
    ];

    it('calls insmod on the legacy modules', (done) => {
      globalThis.sgrud = true;

      const subscription = kernel.insmod(module).subscribe((next) => {
        expect(next).toMatchObject(module);

        appended.forEach((n, i) => {
          expect(append).toHaveBeenNthCalledWith(++i, n);
        });
      });

      const interval = setInterval(() => {
        append.mock.calls.forEach(([i]: [any]) => i.onload?.());
      }, 100);

      subscription.add(() => {
        clearInterval(interval);
        delete globalThis.sgrud;
        done();
      });
    });
  });

  describe.each(Object.keys(usrmod))('calling insmod on a %s module', (key) => {
    const kernel = new Kernel();
    const module = usrmod[key as keyof typeof usrmod];

    it('inserts the module', (done) => {
      globalThis.sgrud = key === 'unpkg';

      const subscription = kernel.insmod(
        module,
        undefined,
        true
      ).subscribe((next) => {
        expect(next).toMatchObject(module);
      });

      const interval = setInterval(() => {
        append.mock.calls.forEach(([i]: [any]) => i.onload?.());
      }, 100);

      subscription.add(() => {
        clearInterval(interval);
        delete globalThis.sgrud;
        done();
      });
    });
  });

  describe('calling insmod on a faulty module', () => {
    const kernel = new Kernel();
    const module = { name: 'nonexistent' } as Kernel.Module;

    it('throws an error', (done) => {
      const subscription = kernel.insmod(module).pipe(
        catchError((error) => of(error))
      ).subscribe((next) => {
        expect(next).toBeInstanceOf(ReferenceError);
      });

      subscription.add(done);
    });
  });

  describe('calling insmod on a module with a too high version', () => {
    const kernel = new Kernel();
    const module = { ...dirmod, name: 'maxver' } as Kernel.Module;

    it('throws an error', (done) => {
      module.sgrudDependencies!.submod = '0.1.0';

      const subscription = kernel.insmod(module).pipe(
        catchError((error) => of(error))
      ).subscribe((next) => {
        expect(next).toBeInstanceOf(RangeError);
      });

      subscription.add(done);
    });
  });

  describe('calling insmod on a module with a too low version', () => {
    const kernel = new Kernel();
    const module = { ...dirmod, name: 'minver' } as Kernel.Module;

    it('throws an error', (done) => {
      module.sgrudDependencies!.submod = '0.0.1';

      const subscription = kernel.insmod(module).pipe(
        catchError((error) => of(error))
      ).subscribe((next) => {
        expect(next).toBeInstanceOf(RangeError);
      });

      subscription.add(done);
    });
  });

  describe('firing the script onerror handler', () => {
    const kernel = new Kernel();
    const module = { ...submod, name: 'module' };

    const appended = [
      Object.assign(document.createElement('script'), {
        src: [
          location.origin,
          'node_modules',
          module.name,
          module.unpkg
        ].join('/'),
        type: 'text/javascript'
      })
    ];

    it('emits the error to the observer', (done) => {
      globalThis.sgrud = true;

      const subscription = kernel.insmod(module).pipe(
        catchError((error) => of(error))
      ).subscribe((next) => {
        expect(next).toBeUndefined();

        appended.forEach((n, i) => {
          expect(append).toHaveBeenNthCalledWith(++i, n);
        });
      });

      const interval = setInterval(() => {
        append.mock.calls.forEach(([i]: [any]) => i.onerror?.());
      }, 100);

      subscription.add(() => {
        clearInterval(interval);
        delete globalThis.sgrud;
        done();
      });
    });
  });

});
