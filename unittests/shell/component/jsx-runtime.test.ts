import { Fragment, jsx } from '@sgrud/shell';

describe('@sgrud/shell/component/jsx-runtime', () => {

  describe('creating a jsx element', () => {
    const jsxElement = jsx('main', {
      children: [
        jsx('span', {
          children: [
            'string'
          ],
          className: 'class',
          id: 'main',
          key: 'key'
        }, 'key')
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(jsxElement).toHaveLength(5);
      expect(jsxElement).toEqual(expect.arrayContaining([
        expect.any(Function)
      ]));
    });
  });

  describe('creating a jsx fragment', () => {
    const jsxFragment = jsx(Fragment, {
      children: [
        jsx('span', {
          children: [
            undefined,
            jsx(Fragment)
          ],
          key: 'key'
        })
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(jsxFragment).toHaveLength(2);
      expect(jsxFragment).toEqual(expect.arrayContaining([
        expect.any(Function)
      ]));
    });
  });

});
