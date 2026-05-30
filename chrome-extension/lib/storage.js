const StorageHelper = {
  get(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  },

  set(items) {
    return new Promise((resolve) => chrome.storage.local.set(items, resolve));
  },

  remove(keys) {
    return new Promise((resolve) => chrome.storage.local.remove(keys, resolve));
  },

  clear() {
    return new Promise((resolve) => chrome.storage.local.clear(resolve));
  },
};
