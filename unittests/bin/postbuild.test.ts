import sgrud from '@sgrud/bin';

describe('@sgrud/bin/postbuild', () => {

  it('functions', () => {
    expect(sgrud.postbuild).toBeInstanceOf(Function);
  });

});
