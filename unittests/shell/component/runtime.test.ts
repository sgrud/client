import { references, render } from '@sgrud/shell';
import { Fragment, jsx, jsxs } from '@sgrud/shell/jsx-runtime';

describe('@sgrud/shell/component/runtime', () => {

  describe('creating a jsx element', () => {
    const element = jsxs('aside', {
      children: [
        null,
        'string',
        undefined,
        jsx('div', {
          className: 'class',
          id: 'div',
          is: 'custom-element',
          key: 'key'
        }, 'key')
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(element).toHaveLength(5);
      expect(element).toEqual(expect.arrayContaining([
        expect.any(Function)
      ]));
    });
  });

  describe('creating a jsx fragment', () => {
    const fragment = jsxs(Fragment, {
      children: [
        null,
        'string',
        undefined,
        jsx('div', {
          className: 'class',
          id: 'div',
          is: 'custom-element',
          key: 'key',
          children: [
            jsx(Fragment)
          ]
        }, 'key')
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(fragment).toHaveLength(3);
      expect(fragment).toEqual(expect.arrayContaining([
        expect.any(Function)
      ]));
    });
  });

  describe('rendering a jsx element tree', () => {
    const element = jsxs('span', {
      children: [
        null,
        'string',
        undefined
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(render(document.body, element)).toBe(document.body);
      expect(document.body.innerHTML).toBe('<span>string</span>');
    });
  });

  describe('retrieving the referenced of a rendered jsx element', () => {
    const element = jsxs('section', {
      children: [
        null,
        'string',
        undefined,
        jsx('article', {
          key: 'key'
        })
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(render(document.body, element)).toBe(document.body);
      expect(references(document.body)?.get('key')).toBeInstanceOf(HTMLElement);
    });
  });

});
