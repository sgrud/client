import doc from '.mocks/doc.mock';
import xhr from '.mocks/xhr.mock';
import { Kernel, Module } from '@sgrud/core';
import { catchError, from, of } from 'rxjs';

describe('@sgrud/core/kernel/kernel', () => {

  global.location = { origin: 'baseHref' } as any;
  const modules = `${location.origin}/node_modules`;

  const depmod = {
    name: 'depmod',
    version: '0.0.0',
    exports: './exports.js',
    unpkg: './unpkg.js',
    digest: {
      exports: 'sha512-depmod-exports',
      unpkg: 'sha512-depmod-unpkg'
    },
    sgrudDependencies: {
      submod: {
        minver: '0.0.1',
        maxver: '0.1.0'
      }
    },
    webDependencies: {
      webmod: {
        exports: {
          webmod: './webmod.exports.js'
        },
        unpkg: [
          './webmod.unpkg.js'
        ]
      }
    }
  } as Module;

  const submod = {
    name: 'submod',
    version: '0.0.5',
    exports: './submod.exports.js',
    unpkg: './submod.unpkg.js',
    digest: {
      exports: 'sha512-submod-exports',
      unpkg: 'sha512-submod-unpkg'
    }
  } as Module;

  describe('instantiating a kernel', () => {
    const kernel = new Kernel();
    const opened = [
      ['GET', 'baseHref/api/sgrud/v1/insmod', true],
      ['GET', `${modules}/depmod/package.json`, true],
      ['GET', `${modules}/submod/package.json`, true]
    ];
    const result = [
      expect.objectContaining({
        integrity: submod.digest!.exports,
        src: modules + '/' + submod.name + '/' + submod.exports,
        type: 'module'
      }),
      expect.objectContaining({
        innerHTML: JSON.stringify({
          imports: {
            webmod: modules + '/webmod/'
              + depmod.webDependencies!.webmod.exports!.webmod
          }
        }),
        type: 'importmap'
      })
    ];

    it('calls insmod on the modules', (done) => {
      const subscription = from(kernel).subscribe((next) => {
        expect(next).toBe(xhr.response);
        expect(xhr.send).toHaveBeenCalledTimes(3);
        expect(doc.querySelectorAll).toHaveBeenCalled();

        opened.forEach((n, i) => {
          expect(xhr.open).toHaveBeenNthCalledWith(++i, ...n);
        });

        result.forEach((n, i) => {
          expect(doc.head.appendChild).toHaveBeenNthCalledWith(++i, n);
        });
      });

      subscription.add(done);

      xhr.trigger('load', ['depmod']);
      xhr.trigger('load', depmod);
      xhr.trigger('load', submod);
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
    const module = { ...depmod, name: 'oldmod' } as Module;
    const opened = ['GET', `${modules}/submod/package.json`, true];
    const result = expect.objectContaining({
      integrity: module.digest!.unpkg,
      src: `${modules}/${module.name}/${module.unpkg!}`,
      type: 'text/javascript'
    });

    it('calls insmod on the legacy modules', (done) => {
      (global as any).sgrud = null;

      const subscription = kernel.insmod(module).subscribe((next) => {
        expect(next).toBe(module);
        expect(xhr.send).toHaveBeenCalledTimes(1);
        expect(xhr.open).toHaveBeenCalledWith(...opened);
        expect(doc.head.appendChild).toHaveBeenCalledWith(result);
      });

      subscription.add(done);
      xhr.trigger('load', submod);
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
      module.sgrudDependencies!.submod!.maxver = '0.0.1';
      module.sgrudDependencies!.submod!.minver = '0.0.1';

      const subscription = kernel.insmod(module).pipe(
        catchError((error) => of(error))
      ).subscribe((next) => {
        expect(next).toBeInstanceOf(RangeError);
      });

      subscription.add(done);
      xhr.trigger('load', submod);
    });
  });

  describe('loading an module with a too low version', () => {
    const kernel = new Kernel();
    const module = { ...depmod, name: 'minver' } as Module;

    it('throws an error', (done) => {
      module.sgrudDependencies!.submod!.maxver = '0.1.0';
      module.sgrudDependencies!.submod!.minver = '0.1.0';

      const subscription = kernel.insmod(module).pipe(
        catchError((error) => of(error))
      ).subscribe((next) => {
        expect(next).toBeInstanceOf(RangeError);
      });

      subscription.add(done);
      xhr.trigger('load', submod);
    });
  });

});
