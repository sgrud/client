import { HttpQuery, Model } from '@sgrud/data';
import { Linker, Target } from '@sgrud/utils';

describe('@sgrud/data/query/http', () => {

  class Class extends Model<Class> {
    protected readonly [Symbol.toStringTag]: string = 'Class';
  }

  new Linker<Target<HttpQuery>, HttpQuery>([
    [HttpQuery, new HttpQuery('url')]
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

  describe('targeting the HttpQuery', () => {
    const linker = new Linker<Target<HttpQuery>, HttpQuery>();
    const pool = linker.getAll(HttpQuery);

    it('appends the HttpQuery to the query pool', () => {
      expect(pool).toContain(linker.get(HttpQuery));
    });
  });

  describe('statically committing an operation through the HttpQuery', () => {
    const query = 'query test';
    const request = JSON.stringify({ query, variables: { } });

    it('commits the operation through the HttpQuery', (done) => {
      const subscription = Class.commit(query).subscribe(() => {
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

  describe('re-targeting the HttpQuery', () => {
    const linker = new Linker<Target<HttpQuery>, HttpQuery>();
    const query = 'mutation test';
    const request = JSON.stringify({ query, variables: { } });

    const update = () => linker.set(
      HttpQuery, new HttpQuery('override', new Map([[Class, 50]]))
    );

    it('overrides the HttpQuery in the query pool', () => {
      update();

      const pool = linker.getAll(HttpQuery);
      expect(pool).toContain(linker.get(HttpQuery));
    });

    it('overrides the HttpQuery in the query pool', (done) => {
      const subscription = Class.commit(query).subscribe(() => {
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
