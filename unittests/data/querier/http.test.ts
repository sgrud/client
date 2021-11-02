import { Linker, Target } from '@sgrud/core';
import { HttpQuerier, Model } from '@sgrud/data';

describe('@sgrud/data/querier/http', () => {

  class Class extends Model<Class> {
    protected readonly [Symbol.toStringTag]: string = 'Class';
  }

  new Linker<Target<HttpQuerier>, HttpQuerier>([
    [HttpQuerier, new HttpQuerier('url')]
  ]);

  const xhrMock = {
    status: 200,
    open: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    setRequestHeader: jest.fn(),
    getAllResponseHeaders: jest.fn(),
    upload: { addEventListener: jest.fn() },
    response: { body: null }
  };

  afterEach(() => xhrMock.addEventListener.mockClear());
  global.XMLHttpRequest = jest.fn().mockImplementation(() => xhrMock) as any;

  describe('targeting the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>, HttpQuerier>();
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
        expect(xhrMock.open).toHaveBeenCalledWith('POST', 'url', true);
        expect(xhrMock.send).toHaveBeenCalledWith(request);
      });

      setTimeout(() => {
        xhrMock.addEventListener.mock.calls.find(([call]) => {
          return call === 'load';
        })[1]({ type: 'load' });
      });

      subscription.add(done);
    });
  });

  describe('re-targeting the HttpQuerier', () => {
    const linker = new Linker<Target<HttpQuerier>, HttpQuerier>();
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
        expect(xhrMock.open).toHaveBeenCalledWith('POST', 'override', true);
        expect(xhrMock.send).toHaveBeenCalledWith(request);
      });

      setTimeout(() => {
        xhrMock.addEventListener.mock.calls.find(([call]) => {
          return call === 'load';
        })[1]({ type: 'load' });
      });

      subscription.add(done);
    });
  });

});
