import sgrud from '@sgrud/bin';

describe('@sgrud/bin/construct', () => {

  it('functions', () => {
    expect(sgrud.construct).toBeInstanceOf(Function);
  });

});
