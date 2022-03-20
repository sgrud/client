import { Kernel, Module } from '@sgrud/core';
import express from 'express';
import { Server } from 'http';
import { catchError, EMPTY, from, of, timeout } from 'rxjs';

declare global {
  namespace globalThis {
    // eslint-disable-next-line no-var
    var sgrud: true | undefined;
  }
}

describe('@sgrud/core/kernel/kernel', () => {

  let server = null! as Server;
  afterAll(() => server.close());
  beforeAll(() => server = express()
    .use('/api/sgrud/v1/insmod', (_, r) => r.send(depmod))
    .use('/node_modules/submod/package.json', (_, r) => r.send(submod))
    .use('/', (_, r) => r.send())
    .listen(58080));

  const append = jest.spyOn(document.head, 'appendChild');
  const select = jest.spyOn(document, 'querySelectorAll');
  const open = jest.spyOn(XMLHttpRequest.prototype, 'open');
  const send = jest.spyOn(XMLHttpRequest.prototype, 'send');
  afterEach(() => [append, select, open, send].forEach((i) => i.mockClear()));

  document.head.innerHTML = `
    <script type="importmap">
      {
        "imports": {
          "module": "/pathname"
        }
      }
    </script>
  `;

  const depmod = {
    name: 'depmod',
    version: '0.1.0',
    exports: './depmod.esmod.js',
    unpkg: './depmod.unpkg.js',
    digest: {
      exports: 'sha512-depmod-exports',
      unpkg: 'sha512-depmod-unpkg'
    },
    sgrudDependencies: {
      submod: '*'
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
    }
  } as Module;

  const submod = {
    name: 'submod',
    version: '0.0.5',
    exports: './submod.esmod.js',
    unpkg: './submod.unpkg.js'
  } as Module;

  describe('instantiating a kernel', () => {
    const kernel = new Kernel();

    const appended = [
      Object.assign(document.createElement('script'), {
        src: location.origin
          + '/node_modules/'
          + submod.name + '/'
          + submod.exports,
        type: 'module'
      }),
      Object.assign(document.createElement('script'), {
        innerHTML: JSON.stringify({
          imports: {
            webmodOne: location.origin
              + '/node_modules/'
              + Object.keys(depmod.webDependencies!)[0] + '/'
              + depmod.webDependencies!.webmod.exports!.webmodOne,
            webmodTwo: location.origin
              + '/node_modules/'
              + Object.keys(depmod.webDependencies!)[0] + '/'
              + depmod.webDependencies!.webmod.exports!.webmodTwo
          }
        }),
        type: 'importmap'
      }),
      Object.assign(document.createElement('script'), {
        src: location.origin
          + '/node_modules/'
          + depmod.name + '/'
          + depmod.exports,
        type: 'module'
      })
    ];

    const opened = [
      [
        'GET',
        location.origin + '/api/sgrud/v1/insmod',
        true
      ],
      [
        'GET',
        location.origin + '/node_modules/' + submod.name + '/package.json',
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
          case 1: expect(next).toMatchObject(depmod); break;
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

      const interval = setInterval(() => {
        append.mock.calls.forEach(([i]: [any]) => i.onload?.());
      }, 100);

      subscription.add(() => {
        clearInterval(interval);
        done();
      });
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
    const module = { ...depmod, name: 'oldmod' };

    const appended = [
      Object.assign(document.createElement('script'), {
        src: location.origin
          + '/node_modules/'
          + Object.keys(module.webDependencies!)[0] + '/'
          + module.webDependencies!.webmod.unpkg![0],
        type: 'text/javascript'
      }),
      Object.assign(document.createElement('script'), {
        src: location.origin
          + '/node_modules/'
          + Object.keys(module.webDependencies!)[0] + '/'
          + module.webDependencies!.webmod.unpkg![1],
        type: 'text/javascript'
      }),
      Object.assign(document.createElement('script'), {
        integrity: module.digest!.unpkg,
        src: location.origin
          + '/node_modules/'
          + module.name + '/'
          + module.unpkg,
        type: 'text/javascript'
      })
    ];

    const opened = [
      [
        'GET',
        location.origin + '/node_modules/' + submod.name + '/package.json',
        true
      ]
    ];

    it('calls insmod on the legacy modules', (done) => {
      globalThis.sgrud = true;

      const subscription = kernel.insmod(module).subscribe((next) => {
        expect(next).toMatchObject(module);
        expect(send).toHaveBeenCalledTimes(opened.length);

        appended.forEach((n, i) => {
          expect(append).toHaveBeenNthCalledWith(++i, n);
        });

        opened.forEach((n, i) => {
          expect(open).toHaveBeenNthCalledWith(++i, ...n);
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

  describe('firing the script onerror handler', () => {
    const kernel = new Kernel();
    const module = { ...submod, name: 'module' };

    const appended = [
      Object.assign(document.createElement('script'), {
        src: location.origin
          + '/node_modules/'
          + module.name + '/'
          + module.exports,
        type: 'module'
      })
    ];

    it('emits the error to the observer', (done) => {
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
        done();
      });
    });
  });

  describe('loading an faulty module', () => {
    const kernel = new Kernel();
    const module = { name: 'nonexistent' } as Module;

    it('throws an error', (done) => {
      const subscription = kernel.insmod(module).pipe(
        catchError((error) => of(error))
      ).subscribe((next) => {
        expect(next).toBeInstanceOf(ReferenceError);
      });

      subscription.add(done);
    });
  });

  describe('loading an module with a too high version', () => {
    const kernel = new Kernel();
    const module = { ...depmod, name: 'maxver' } as Module;

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

  describe('loading an module with a too low version', () => {
    const kernel = new Kernel();
    const module = { ...depmod, name: 'minver' } as Module;

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

});
