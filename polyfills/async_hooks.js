// Polyfill for Node.js async_hooks - React Native doesn't have this
// This is a no-op shim to prevent runtime errors

class AsyncLocalStorage {
  constructor() {
    this._store = null;
  }

  run(store, callback) {
    this._store = store;
    try {
      return callback(store);
    } finally {
      this._store = null;
    }
  }

  getStore() {
    return this._store;
  }
}

module.exports = { AsyncLocalStorage };