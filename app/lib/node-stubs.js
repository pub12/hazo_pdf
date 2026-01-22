/**
 * Browser stubs for Node.js built-in modules
 * Used by Turbopack to replace modules that don't work in browsers
 * These stubs allow imports to succeed but provide no-op implementations
 */

// Empty event emitter for stream-based modules
class EventEmitter {
  on() { return this; }
  once() { return this; }
  off() { return this; }
  emit() { return false; }
  addListener() { return this; }
  removeListener() { return this; }
  removeAllListeners() { return this; }
  listeners() { return []; }
  listenerCount() { return 0; }
  setMaxListeners() { return this; }
  getMaxListeners() { return 10; }
  prependListener() { return this; }
  prependOnceListener() { return this; }
  eventNames() { return []; }
}

// Stream stubs
class Readable extends EventEmitter {
  read() { return null; }
  pipe() { return this; }
  unpipe() { return this; }
  destroy() { return this; }
  push() { return false; }
}

class Writable extends EventEmitter {
  write() { return true; }
  end() { return this; }
  destroy() { return this; }
}

class Duplex extends EventEmitter {
  read() { return null; }
  write() { return true; }
  end() { return this; }
  pipe() { return this; }
  destroy() { return this; }
}

class Transform extends Duplex {
  _transform(chunk, encoding, callback) { callback(); }
}

// AsyncLocalStorage stub (for async_hooks)
class AsyncLocalStorage {
  getStore() { return undefined; }
  run(_store, callback, ...args) { return callback(...args); }
  enterWith() {}
  exit(callback, ...args) { return callback(...args); }
  disable() {}
}

// fs stubs - all operations are no-ops or return errors
const fs = {
  readFile: (path, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    if (cb) cb(new Error('fs not available in browser'));
  },
  readFileSync: () => { throw new Error('fs not available in browser'); },
  writeFile: (path, data, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    if (cb) cb(new Error('fs not available in browser'));
  },
  writeFileSync: () => { throw new Error('fs not available in browser'); },
  existsSync: () => false,
  mkdirSync: () => {},
  readdirSync: () => [],
  statSync: () => ({ isDirectory: () => false, isFile: () => false }),
  stat: (path, callback) => callback(new Error('fs not available in browser')),
  access: (path, mode, callback) => {
    const cb = typeof mode === 'function' ? mode : callback;
    if (cb) cb(new Error('fs not available in browser'));
  },
  createReadStream: () => new Readable(),
  createWriteStream: () => new Writable(),
  promises: {
    readFile: () => Promise.reject(new Error('fs not available in browser')),
    writeFile: () => Promise.reject(new Error('fs not available in browser')),
    access: () => Promise.reject(new Error('fs not available in browser')),
    stat: () => Promise.reject(new Error('fs not available in browser')),
    mkdir: () => Promise.reject(new Error('fs not available in browser')),
    readdir: () => Promise.reject(new Error('fs not available in browser')),
  },
  constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 },
};

// path stubs
const path = {
  join: (...args) => args.filter(Boolean).join('/').replace(/\/+/g, '/'),
  resolve: (...args) => args.filter(Boolean).join('/').replace(/\/+/g, '/'),
  dirname: (p) => p.split('/').slice(0, -1).join('/') || '.',
  basename: (p, ext) => {
    const base = p.split('/').pop() || '';
    return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
  },
  extname: (p) => {
    const base = p.split('/').pop() || '';
    const idx = base.lastIndexOf('.');
    return idx > 0 ? base.slice(idx) : '';
  },
  parse: (p) => ({
    root: p.startsWith('/') ? '/' : '',
    dir: path.dirname(p),
    base: path.basename(p),
    ext: path.extname(p),
    name: path.basename(p, path.extname(p)),
  }),
  format: (obj) => `${obj.dir}/${obj.base}`,
  isAbsolute: (p) => p.startsWith('/'),
  relative: (from, to) => to,
  normalize: (p) => p.replace(/\/+/g, '/'),
  sep: '/',
  delimiter: ':',
  posix: null, // Will be set below
  win32: null,
};
path.posix = path;
path.win32 = path;

// os stubs
const os = {
  platform: () => 'browser',
  type: () => 'Browser',
  arch: () => 'wasm',
  release: () => '1.0.0',
  hostname: () => 'localhost',
  homedir: () => '/',
  tmpdir: () => '/tmp',
  cpus: () => [{ model: 'Browser', speed: 0 }],
  totalmem: () => 0,
  freemem: () => 0,
  uptime: () => 0,
  loadavg: () => [0, 0, 0],
  networkInterfaces: () => ({}),
  userInfo: () => ({ username: 'browser', uid: -1, gid: -1, shell: null, homedir: '/' }),
  endianness: () => 'LE',
  EOL: '\n',
  constants: { signals: {}, errno: {} },
};

// readline stubs
const readline = {
  createInterface: () => ({
    on: function() { return this; },
    once: function() { return this; },
    close: () => {},
    question: (query, callback) => callback(''),
    prompt: () => {},
    write: () => {},
    [Symbol.asyncIterator]: async function*() {},
  }),
  cursorTo: () => true,
  clearLine: () => true,
  clearScreenDown: () => true,
  moveCursor: () => true,
};

// crypto stubs (minimal)
const crypto = {
  randomBytes: (size) => new Uint8Array(size),
  createHash: () => ({
    update: function() { return this; },
    digest: () => 'stub-hash',
  }),
  createHmac: () => ({
    update: function() { return this; },
    digest: () => 'stub-hmac',
  }),
  randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }),
};

// zlib stubs
const zlib = {
  createGzip: () => new Transform(),
  createGunzip: () => new Transform(),
  createDeflate: () => new Transform(),
  createInflate: () => new Transform(),
  gzip: (data, callback) => callback(null, data),
  gunzip: (data, callback) => callback(null, data),
  deflate: (data, callback) => callback(null, data),
  inflate: (data, callback) => callback(null, data),
  gzipSync: (data) => data,
  gunzipSync: (data) => data,
  constants: {},
};

// stream module
const stream = {
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough: Transform,
  Stream: EventEmitter,
  pipeline: (...args) => {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') callback(new Error('stream not available in browser'));
  },
  finished: (stream, callback) => callback(new Error('stream not available in browser')),
};

// string_decoder stubs
class StringDecoder {
  constructor() {}
  write(buffer) { return buffer.toString ? buffer.toString() : String(buffer); }
  end(buffer) { return buffer ? this.write(buffer) : ''; }
}

// util stubs (minimal)
const util = {
  inherits: (ctor, superCtor) => {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  },
  promisify: (fn) => (...args) => new Promise((resolve, reject) => {
    fn(...args, (err, result) => err ? reject(err) : resolve(result));
  }),
  inspect: (obj) => JSON.stringify(obj),
  format: (...args) => args.map(String).join(' '),
  debuglog: () => () => {},
  deprecate: (fn) => fn,
  isDeepStrictEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  types: {
    isDate: (v) => v instanceof Date,
    isRegExp: (v) => v instanceof RegExp,
  },
};

// net stubs
const net = {
  createServer: () => new EventEmitter(),
  createConnection: () => new Duplex(),
  connect: () => new Duplex(),
  Socket: Duplex,
  Server: EventEmitter,
  isIP: () => 0,
  isIPv4: () => false,
  isIPv6: () => false,
};

// tls stubs
const tls = {
  createServer: () => new EventEmitter(),
  connect: () => new Duplex(),
  TLSSocket: Duplex,
  Server: EventEmitter,
};

// http/https stubs
const http = {
  createServer: () => new EventEmitter(),
  request: () => new Duplex(),
  get: () => new Duplex(),
  Agent: class {},
  globalAgent: {},
  METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
  STATUS_CODES: { 200: 'OK', 404: 'Not Found', 500: 'Internal Server Error' },
};

const https = { ...http };

// events module
const events = {
  EventEmitter,
  once: () => Promise.reject(new Error('events.once not available in browser')),
};

// Export everything
export {
  AsyncLocalStorage,
  fs,
  path,
  os,
  readline,
  crypto,
  zlib,
  stream,
  StringDecoder,
  util,
  net,
  tls,
  http,
  https,
  events,
  EventEmitter,
  Readable,
  Writable,
  Duplex,
  Transform,
};

// Default export for CommonJS compatibility
export default {
  AsyncLocalStorage,
  fs,
  path,
  os,
  readline,
  crypto,
  zlib,
  stream,
  StringDecoder,
  util,
  net,
  tls,
  http,
  https,
  events,
};
