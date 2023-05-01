import { createElement, createFragment, html, references, render } from '@sgrud/shell';

describe('@sgrud/shell/component/runtime', () => {

  /*
   * Unittests
   */

  describe('creating a jsx element', () => {
    const element = createElement('aside', {
      children: [
        null,
        'string',
        undefined,
        createElement('div', {
          className: 'class',
          id: 'div',
          is: 'custom-element',
          key: 'key'
        }, 'key')
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(element).toHaveLength(5);
      expect(element).toEqual(expect.arrayContaining([expect.any(Function)]));
    });
  });

  describe('creating a jsx fragment', () => {
    const fragment = createElement(createFragment, {
      children: [
        null,
        'string',
        undefined,
        createElement('div', {
          className: 'class',
          id: 'div',
          is: 'custom-element',
          key: 'key',
          children: [
            createElement(createFragment)
          ]
        }, 'key')
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(fragment).toHaveLength(3);
      expect(fragment).toEqual(expect.arrayContaining([expect.any(Function)]));
    });
  });

  describe('rendering a jsx element tree', () => {
    const element = createElement('span', {
      children: [
        null,
        'string',
        undefined
      ]
    });

    it('renders the corresponding html element', () => {
      expect(render(document.body, element)).toBe(document.body);
      expect(document.body.innerHTML).toBe('<span>string</span>');
    });
  });

  describe('rendering arbitrary html as jsx element', () => {
    const element = html('<span>string</span>', 'key');

    it('renders the corresponding html element', () => {
      expect(render(document.body, element)).toBe(document.body);
      expect(document.body.innerHTML).toContain('</inner-html>');
    });
  });

  describe('retrieving the referenced of a rendered jsx element', () => {
    const element = createElement('section', {
      children: [
        null,
        'string',
        undefined,
        createElement('article', {
          key: 'key'
        })
      ]
    });

    it('returns the corresponding incremental-dom', () => {
      expect(render(document.body, element)).toBe(document.body);
      expect(references(document.body)!.get('key')).toBeInstanceOf(HTMLElement);
    });
  });

});
