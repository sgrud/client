import sgrud from '@sgrud/bin';

describe('@sgrud/bin/kickstart', () => {

  it('functions', () => {
    expect(sgrud.kickstart).toBeInstanceOf(Function);
  });

});
