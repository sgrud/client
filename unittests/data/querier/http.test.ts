import xhr from '.mocks/xhr.mock';
import { Linker, Target } from '@sgrud/core';
import { HttpQuerier, Model } from '@sgrud/data';

describe('@sgrud/data/querier/http', () => {

  class Class extends Model<Class> {
    protected readonly [Symbol.toStringTag]: string = 'Class';
  }

  new Linker<Target<HttpQuerier>>([
    [HttpQuerier, new HttpQuerier('url')]
  ]);

  describe('targeting the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const queriers = linker.getAll(HttpQuerier);

    it('appends the HttpQuerier to the queriers', () => {
      expect(queriers).toContain(linker.get(HttpQuerier));
    });
  });

  describe('statically committing an operation through the HttpQuerier', () => {
    const operation = 'query test';
    const request = JSON.stringify({ query: operation, variables: { } });

    it('commits the operation through the HttpQuerier', (done) => {
      const subscription = Class.commit(operation).subscribe(() => {
        expect(xhr.open).toHaveBeenCalledWith('POST', 'url', true);
        expect(xhr.send).toHaveBeenCalledWith(request);
      });

      subscription.add(done);
      xhr.trigger('load');
    });
  });

  describe('re-targeting the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>>();
    const operation = 'mutation test';
    const request = JSON.stringify({ query: operation, variables: { } });

    const update = () => linker.set(
      HttpQuerier, new HttpQuerier('override', new Map([[Class, 50]]))
    );

    it('overrides the previously targeted HttpQuerier', () => {
      update();

      const querier = linker.getAll(HttpQuerier);
      expect(querier).toContain(linker.get(HttpQuerier));
    });

    it('overrides the previously targeted HttpQuerier', (done) => {
      const subscription = Class.commit(operation).subscribe(() => {
        expect(xhr.open).toHaveBeenCalledWith('POST', 'override', true);
        expect(xhr.send).toHaveBeenCalledWith(request);
      });

      subscription.add(done);
      xhr.trigger('load');
    });
  });

});
