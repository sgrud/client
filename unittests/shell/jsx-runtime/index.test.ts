import { createElement, createFragment } from '@sgrud/shell';
import { Fragment, jsx, jsxs } from '@sgrud/shell/jsx-runtime';

describe('@sgrud/shell/jsx-runtime', () => {

  /*
   * Unittests
   */

  describe('importing the re-exported modules', () => {
    it('imports the re-exported modules correctly', () => {
      expect(jsx).toBe(createElement);
      expect(jsxs).toBe(createElement);
      expect(Fragment).toBe(createFragment);
    });
  });

});
