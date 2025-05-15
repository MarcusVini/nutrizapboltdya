// Polyfill para a variável browser
declare global {
  interface Window {
    browser: any;
    chrome: any;
  }
}

// Definindo a variável browser globalmente com todas as APIs necessárias
window.browser = window.browser || {
  runtime: {
    getManifest: () => ({}),
    sendMessage: () => Promise.resolve(),
    onMessage: {
      addListener: () => {},
      removeListener: () => {}
    },
    onInstalled: {
      addListener: () => {}
    },
    getURL: (path: string) => path
  },
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
      clear: () => Promise.resolve()
    },
    sync: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
      clear: () => Promise.resolve()
    }
  },
  tabs: {
    query: () => Promise.resolve([]),
    sendMessage: () => Promise.resolve(),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    remove: () => Promise.resolve()
  },
  webRequest: {
    onBeforeRequest: {
      addListener: () => {},
      removeListener: () => {}
    },
    onBeforeSendHeaders: {
      addListener: () => {},
      removeListener: () => {}
    }
  },
  cookies: {
    get: () => Promise.resolve({}),
    set: () => Promise.resolve({}),
    remove: () => Promise.resolve({}),
    getAll: () => Promise.resolve([])
  },
  windows: {
    create: () => Promise.resolve({}),
    get: () => Promise.resolve({}),
    getAll: () => Promise.resolve([])
  },
  bookmarks: {
    create: () => Promise.resolve({}),
    get: () => Promise.resolve([]),
    remove: () => Promise.resolve()
  },
  history: {
    search: () => Promise.resolve([]),
    addUrl: () => Promise.resolve(),
    deleteUrl: () => Promise.resolve()
  },
  downloads: {
    download: () => Promise.resolve({}),
    search: () => Promise.resolve([]),
    removeFile: () => Promise.resolve()
  },
  notifications: {
    create: () => Promise.resolve(),
    clear: () => Promise.resolve()
  },
  contextMenus: {
    create: () => {},
    remove: () => Promise.resolve(),
    removeAll: () => Promise.resolve()
  },
  commands: {
    getAll: () => Promise.resolve([])
  },
  extension: {
    getURL: (path: string) => path,
    getViews: () => []
  }
};

// Se estiver no Chrome, copiar todas as funcionalidades do chrome para browser
if (window.chrome) {
  Object.keys(window.chrome).forEach(key => {
    if (!window.browser[key]) {
      window.browser[key] = window.chrome[key];
    }
  });
}

export {}; 