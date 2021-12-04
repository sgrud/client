import { Kernel, Module } from '@sgrud/core';
import express from 'express';
import { Server } from 'http';
import { catchError, from, of } from 'rxjs';

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
          webmod: './webmod.esmod.js'
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
    exports: './submod.esmod.js',
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
    ['~>3.2.1', '3.3.2'],
    ['~>3.2.1', '3.2.0'],
    ['~1', '0.2.3'],
    ['~>1', '2.2.3'],
    ['~1.0', '1.1.0'],
    ['<1', '1.0.0'],
    ['>=1.2', '1.1.1'],
    ['~v0.5.4-beta', '0.5.4-alpha'],
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
    ['>= 1.0.0', '1.0.0'],
    ['>=  1.0.0', '1.0.1'],
    ['>=   1.0.0', '1.1.0'],
    ['> 1.0.0', '1.0.1'],
    ['>  1.0.0', '1.1.0'],
    ['<=   2.0.0', '2.0.0'],
    ['<= 2.0.0', '1.9999.9999'],
    ['<=  2.0.0', '0.2.9'],
    ['<    2.0.0', '1.9999.9999'],
    ['<\t2.0.0', '0.2.9'],
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
    ['~>3.2.1', '3.2.2'],
    ['~1', '1.2.3'],
    ['~>1', '1.2.3'],
    ['~> 1', '1.2.3'],
    ['~1.0', '1.0.2'],
    ['~ 1.0', '1.0.2'],
    ['~ 1.0.3', '1.0.12'],
    ['>=1', '1.0.0'],
    ['>= 1', '1.0.0'],
    ['<1.2', '1.1.1'],
    ['< 1.2', '1.1.1'],
    ['~v0.5.4-pre', '0.5.5'],
    ['~v0.5.4-pre', '0.5.4'],
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
            webmod: location.origin
              + '/node_modules/'
              + Object.keys(depmod.webDependencies!)[0] + '/'
              + depmod.webDependencies!.webmod.exports!.webmod
          }
        }),
        type: 'importmap'
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
      const subscription = from(new Kernel()).subscribe((next) => {
        expect(next).toMatchObject(submod);
        expect(select).toHaveBeenCalled();
        expect(send).toHaveBeenCalledTimes(2);

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
          + Object.keys(depmod.webDependencies!)[0] + '/'
          + depmod.webDependencies!.webmod.unpkg![0],
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
      (global as any).sgrud = null;

      const subscription = kernel.insmod(module).subscribe((next) => {
        expect(next).toMatchObject(module);
        expect(send).toHaveBeenCalledTimes(1);

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
