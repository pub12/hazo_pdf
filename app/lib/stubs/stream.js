// stream stub for browser
class EventEmitter {
  constructor() { this._events = {}; }
  on(event, listener) { (this._events[event] = this._events[event] || []).push(listener); return this; }
  once(event, listener) { const wrapped = (...args) => { this.off(event, wrapped); listener(...args); }; return this.on(event, wrapped); }
  off(event, listener) { if (this._events[event]) this._events[event] = this._events[event].filter(l => l !== listener); return this; }
  emit(event, ...args) { (this._events[event] || []).forEach(l => l(...args)); return this._events[event]?.length > 0; }
  addListener(event, listener) { return this.on(event, listener); }
  removeListener(event, listener) { return this.off(event, listener); }
  removeAllListeners(event) { if (event) delete this._events[event]; else this._events = {}; return this; }
  listeners(event) { return this._events[event] || []; }
  listenerCount(event) { return (this._events[event] || []).length; }
  setMaxListeners() { return this; }
  getMaxListeners() { return 10; }
}

class Readable extends EventEmitter {
  constructor() { super(); this.readable = true; }
  read() { return null; }
  pipe(dest) { return dest; }
  unpipe() { return this; }
  destroy() { this.readable = false; return this; }
  push() { return false; }
  setEncoding() { return this; }
  pause() { return this; }
  resume() { return this; }
}

class Writable extends EventEmitter {
  constructor() { super(); this.writable = true; }
  write(chunk, encoding, callback) { if (callback) callback(); return true; }
  end(chunk, encoding, callback) { if (typeof chunk === 'function') chunk(); else if (callback) callback(); return this; }
  destroy() { this.writable = false; return this; }
  cork() {}
  uncork() {}
  setDefaultEncoding() { return this; }
}

class Duplex extends EventEmitter {
  constructor() { super(); this.readable = true; this.writable = true; }
  read() { return null; }
  write(chunk, encoding, callback) { if (callback) callback(); return true; }
  end(chunk, encoding, callback) { if (typeof chunk === 'function') chunk(); else if (callback) callback(); return this; }
  pipe(dest) { return dest; }
  destroy() { this.readable = false; this.writable = false; return this; }
}

class Transform extends Duplex {
  _transform(chunk, encoding, callback) { callback(); }
  _flush(callback) { callback(); }
}

class PassThrough extends Transform {}

const stream = {
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough,
  Stream: EventEmitter,
  pipeline: (...args) => {
    const callback = args[args.length - 1];
    if (typeof callback === 'function') callback(null);
    return args[0];
  },
  finished: (stream, opts, callback) => {
    const cb = typeof opts === 'function' ? opts : callback;
    if (cb) setTimeout(() => cb(null), 0);
    return () => {};
  },
};

export default stream;
export { Readable, Writable, Duplex, Transform, PassThrough, EventEmitter };
export const { Stream, pipeline, finished } = stream;
