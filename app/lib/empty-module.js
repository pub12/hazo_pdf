/**
 * Empty module placeholder for Node.js-only modules in browser builds
 * Used by Turbopack to replace modules like async_hooks that don't work in browsers
 */
export const AsyncLocalStorage = class {
  getStore() { return undefined; }
  run(_store, callback, ...args) { return callback(...args); }
  enterWith() {}
  exit(callback, ...args) { return callback(...args); }
};

export default {};
