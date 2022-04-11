import { Fragment, jsx, references, render } from '@sgrud/shell';

describe('@sgrud/shell/component/runtime', () => {

  describe('creating a jsx element', () => {
    const jsxElement = jsx('aside', {
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
      expect(jsxElement).toHaveLength(5);
      expect(jsxElement).toEqual(expect.arrayContaining([
        expect.any(Function)
      ]));
    });
  });

  describe('creating a jsx fragment', () => {
    const jsxFragment = jsx(Fragment, {
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
      expect(jsxFragment).toHaveLength(3);
      expect(jsxFragment).toEqual(expect.arrayContaining([
        expect.any(Function)
      ]));
    });
  });

  describe('rendering a jsx element tree', () => {
    const elements = jsx('span', {
      children: [
        null,
        'string',
        undefined
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(render(document.body, elements)).toBe(document.body);
      expect(document.body.innerHTML).toBe('<span>string</span>');
    });
  });

  describe('retrieving the referenced of a rendered jsx element', () => {
    const elements = jsx('section', {
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
      expect(render(document.body, elements)).toBe(document.body);
      expect(references(document.body)?.get('key')).toBeInstanceOf(HTMLElement);
    });
  });

});
