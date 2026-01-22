// async_hooks stub for browser
class AsyncLocalStorage {
  constructor() {
    this._store = undefined;
  }
  getStore() {
    return this._store;
  }
  run(store, callback, ...args) {
    const prev = this._store;
    this._store = store;
    try {
      return callback(...args);
    } finally {
      this._store = prev;
    }
  }
  enterWith(store) {
    this._store = store;
  }
  exit(callback, ...args) {
    const prev = this._store;
    this._store = undefined;
    try {
      return callback(...args);
    } finally {
      this._store = prev;
    }
  }
  disable() {
    this._store = undefined;
  }
}

class AsyncResource {
  constructor(type, options) {
    this.type = type;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.apply(thisArg, args);
  }
  emitDestroy() {}
  asyncId() { return 0; }
  triggerAsyncId() { return 0; }
}

const async_hooks = {
  AsyncLocalStorage,
  AsyncResource,
  createHook: () => ({ enable: () => {}, disable: () => {} }),
  executionAsyncId: () => 0,
  executionAsyncResource: () => ({}),
  triggerAsyncId: () => 0,
};

export default async_hooks;
export { AsyncLocalStorage, AsyncResource };
export const { createHook, executionAsyncId, executionAsyncResource, triggerAsyncId } = async_hooks;
