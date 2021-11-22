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
      submod: '*'
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

  /**
   * Exclusive [semver](https://semver.org) ranges/versions. Subset taken from:
   * https://github.com/npm/node-semver/blob/main/test/fixtures/range-exclude.js
   */
  const excludes = [
    ['^1.2.3+build', '2.0.0'],
    ['^1.2.3+build', '1.2.0'],
    ['^1.2.3', '1.2.3-pre'],
    ['^1.2', '1.2.0-pre'],
    ['>1.2', '1.3.0-beta'],
    ['<=1.2.3', '1.2.3-beta'],
    ['^1.2.3', '1.2.3-beta'],
    ['=0.7.x', '0.7.0-asdf'],
    ['>=0.7.x', '0.7.0-asdf'],
    ['<=0.7.x', '0.7.0-asdf'],
    ['1.0.0', '1.0.1'],
    ['>=1.0.0', '0.0.0'],
    ['>=1.0.0', '0.0.1'],
    ['>=1.0.0', '0.1.0'],
    ['>1.0.0', '0.0.1'],
    ['>1.0.0', '0.1.0'],
    ['<=2.0.0', '3.0.0'],
    ['<=2.0.0', '2.9999.9999'],
    ['<=2.0.0', '2.2.9'],
    ['<2.0.0', '2.9999.9999'],
    ['<2.0.0', '2.2.9'],
    ['>=0.1.97', '0.1.93'],
    ['0.1.20 || 1.2.4', '1.2.3'],
    ['>=0.2.3 || <0.0.1', '0.0.3'],
    ['>=0.2.3 || <0.0.1', '0.2.2'],
    ['2.x.x', '3.1.3'],
    ['1.2.x', '1.3.3'],
    ['1.2.x || 2.x', '3.1.3'],
    ['1.2.x || 2.x', '1.1.3'],
    ['2.*.*', '1.1.3'],
    ['2.*.*', '3.1.3'],
    ['1.2.*', '1.3.3'],
    ['1.2.* || 2.*', '3.1.3'],
    ['1.2.* || 2.*', '1.1.3'],
    ['2', '1.1.2'],
    ['2.3', '2.4.1'],
    ['~0.0.1', '0.1.0-alpha'],
    ['~0.0.1', '0.1.0'],
    ['~2.4', '2.5.0'],
    ['~2.4', '2.3.9'],
    ['~1', '0.2.3'],
    ['~1.0', '1.1.0'],
    ['<1', '1.0.0'],
    ['>=1.2', '1.1.1'],
    ['~0.5.4-beta', '0.5.4-alpha'],
    ['=0.7.x', '0.8.2'],
    ['>=0.7.x', '0.6.2'],
    ['<0.7.x', '0.7.2'],
    ['<1.2.3', '1.2.3-beta'],
    ['=1.2.3', '1.2.3-beta'],
    ['>1.2', '1.2.8'],
    ['^0.0.1', '0.0.2-alpha'],
    ['^0.0.1', '0.0.2'],
    ['^1.2.3', '2.0.0-alpha'],
    ['^1.2.3', '1.2.2'],
    ['^1.2', '1.1.9'],
    ['^1.0.0', '2.0.0-rc1'],
    ['1.1.x', '1.0.0-a'],
    ['1.1.x', '1.1.0-a'],
    ['1.1.x', '1.2.0-a'],
    ['1.x', '1.0.0-a'],
    ['1.x', '1.1.0-a'],
    ['1.x', '1.2.0-a'],
    ['>=1.0.0 <1.1.0', '1.1.0'],
    ['>=1.0.0 <1.1.0', '1.1.0-pre'],
    ['>=1.0.0 <1.1.0-pre', '1.1.0-pre']
  ] as [string, string][];

  /**
   * Inclusive [semver](https://semver.org) ranges/versions. Subset taken from:
   * https://github.com/npm/node-semver/blob/main/test/fixtures/range-include.js
   */
  const includes = [
    ['^1.2.3+build', '1.2.3'],
    ['^1.2.3+build', '1.3.0'],
    ['1.0.0', '1.0.0'],
    ['>=*', '0.2.4'],
    ['', '1.0.0'],
    ['>1.0.0', '1.1.0'],
    ['<=2.0.0', '2.0.0'],
    ['<=2.0.0', '1.9999.9999'],
    ['<=2.0.0', '0.2.9'],
    ['<2.0.0', '1.9999.9999'],
    ['<2.0.0', '0.2.9'],
    ['>=1.0.0', '1.0.0'],
    ['>=1.0.0', '1.0.1'],
    ['>=1.0.0', '1.1.0'],
    ['>1.0.0', '1.0.1'],
    ['>=0.1.97', '0.1.97'],
    ['0.1.20 || 1.2.4', '1.2.4'],
    ['>=0.2.3 || <0.0.1', '0.0.0'],
    ['>=0.2.3 || <0.0.1', '0.2.3'],
    ['>=0.2.3 || <0.0.1', '0.2.4'],
    ['||', '1.3.4'],
    ['2.x.x', '2.1.3'],
    ['1.2.x', '1.2.3'],
    ['1.2.x || 2.x', '2.1.3'],
    ['1.2.x || 2.x', '1.2.3'],
    ['x', '1.2.3'],
    ['2.*.*', '2.1.3'],
    ['1.2.*', '1.2.3'],
    ['1.2.* || 2.*', '2.1.3'],
    ['1.2.* || 2.*', '1.2.3'],
    ['*', '1.2.3'],
    ['2', '2.1.2'],
    ['2.3', '2.3.1'],
    ['~0.0.1', '0.0.1'],
    ['~0.0.1', '0.0.2'],
    ['~x', '0.0.9'],
    ['~2', '2.0.9'],
    ['~2.4', '2.4.0'],
    ['~2.4', '2.4.5'],
    ['~1', '1.2.3'],
    ['~1.0', '1.0.2'],
    ['~1.0.3', '1.0.12'],
    ['>=1', '1.0.0'],
    ['>= 1', '1.0.0'],
    ['<1.2', '1.1.1'],
    ['~0.5.4-pre', '0.5.5'],
    ['~0.5.4-pre', '0.5.4'],
    ['=0.7.x', '0.7.2'],
    ['<=0.7.x', '0.7.2'],
    ['>=0.7.x', '0.7.2'],
    ['<=0.7.x', '0.6.2'],
    ['~1.2.1 >=1.2.3', '1.2.3'],
    ['~1.2.1 =1.2.3', '1.2.3'],
    ['~1.2.1 1.2.3', '1.2.3'],
    ['~1.2.1 >=1.2.3 1.2.3', '1.2.3'],
    ['~1.2.1 1.2.3 >=1.2.3', '1.2.3'],
    ['>=1.2.1 1.2.3', '1.2.3'],
    ['1.2.3 >=1.2.1', '1.2.3'],
    ['>=1.2.3 >=1.2.1', '1.2.3'],
    ['>=1.2.1 >=1.2.3', '1.2.3'],
    ['>=1.2', '1.2.8'],
    ['^1.2.3', '1.8.1'],
    ['^0.1.2', '0.1.2'],
    ['^0.1', '0.1.2'],
    ['^0.0.1', '0.0.1'],
    ['^1.2', '1.4.2'],
    ['^1.2 ^1', '1.4.2'],
    ['^1.2.3-alpha', '1.2.3-pre'],
    ['^1.2.0-alpha', '1.2.0-pre'],
    ['^0.0.1-alpha', '0.0.1-beta'],
    ['^0.0.1-alpha', '0.0.1'],
    ['^0.1.1-alpha', '0.1.1-beta'],
    ['^x', '1.2.3'],
    ['<=7.x', '7.9.9']
  ] as [string, string][];

  describe('instantiating a kernel', () => {
    const kernel = new Kernel();
    const opened = [
      ['GET', 'baseHref/api/sgrud/v1/insmod', true],
      ['GET', `${modules}/${submod.name}/package.json`, true]
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
            webmod: modules + '/' + Object.keys(depmod.webDependencies!).pop()
               + '/' + depmod.webDependencies!.webmod.exports!.webmod
          }
        }),
        type: 'importmap'
      })
    ];

    it('calls insmod on the modules', (done) => {
      const subscription = from(kernel).subscribe((next) => {
        expect(next).toBe(xhr.response);
        expect(xhr.send).toHaveBeenCalledTimes(2);
        expect(doc.querySelectorAll).toHaveBeenCalled();

        opened.forEach((n, i) => {
          expect(xhr.open).toHaveBeenNthCalledWith(++i, ...n);
        });

        result.forEach((n, i) => {
          expect(doc.head.appendChild).toHaveBeenNthCalledWith(++i, n);
        });
      });

      subscription.add(done);

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
    const module = { ...depmod, name: 'oldmod' };
    const opened = ['GET', `${modules}/${submod.name}/package.json`, true];
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
      kernel.insmod(module).pipe(
        catchError((error) => of(error))
      ).subscribe((next) => {
        expect(next).toBeInstanceOf(ReferenceError);
        done();
      });
    });
  });

  describe.each(excludes)('"%s" is satisfied by "%s"', (semver, version) => {
    const kernel = new Kernel();

    it('returns false', () => {
      expect(kernel.satisfies(version, semver)).toBeFalsy();
    });
  });

  describe.each(includes)('"%s" is satisfied by "%s"', (semver, version) => {
    const kernel = new Kernel();

    it('returns true', () => {
      expect(kernel.satisfies(version, semver)).toBeTruthy();
    });
  });

});
