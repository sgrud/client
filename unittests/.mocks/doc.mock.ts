afterEach(() => {
  doc.createElement.mockClear();
  doc.head.appendChild.mockClear();
  doc.querySelectorAll.mockClear();
});

const doc = {
  createElement: jest.fn().mockImplementation(() => ({
    get onload(): () => void {
      return () => null;
    },
    set onload(callback: () => void) {
      setTimeout(callback);
    },
    remove: jest.fn()
  })),
  head: {
    appendChild: jest.fn()
  },
  querySelectorAll: jest.fn().mockImplementation(() => [
    {
      innerHTML: '{ "imports": { "module": "/pathname" } }',
      type: 'importmap'
    }
  ])
};

global.document = doc as any;
export default doc;
