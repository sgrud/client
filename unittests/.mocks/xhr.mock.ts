afterEach(() => {
  xhr.open.mockClear();
  xhr.send.mockClear();
  xhr.addEventListener.mockClear();
  xhr.setRequestHeader.mockClear();
  xhr.getAllResponseHeaders.mockClear();
  xhr.upload.addEventListener.mockClear();
});

const xhr = {
  open: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  setRequestHeader: jest.fn(),
  getAllResponseHeaders: jest.fn(),
  upload: {
    addEventListener: jest.fn()
  },

  status: 200,
  readyState: 4,
  response: null as any,

  trigger: (type: string, response: unknown = null, upload?: true): void => {
    xhr.response = response;
    const calls = (upload ? xhr.upload : xhr).addEventListener.mock.calls;
    calls.slice().reverse().find(([call]) => call === type)[1]({ type });
  }
};

global.XMLHttpRequest = (() => xhr) as any;
export default xhr;
