import sgrud from '@sgrud/bin';

describe('@sgrud/bin/universal', () => {

  it('functions', () => {
    expect(sgrud.universal).toBeInstanceOf(Function);
  });

});
