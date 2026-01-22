// events stub for browser
class EventEmitter {
  constructor() {
    this._events = {};
    this._maxListeners = 10;
  }
  on(event, listener) {
    (this._events[event] = this._events[event] || []).push(listener);
    return this;
  }
  once(event, listener) {
    const wrapped = (...args) => {
      this.off(event, wrapped);
      listener(...args);
    };
    wrapped.listener = listener;
    return this.on(event, wrapped);
  }
  off(event, listener) {
    if (this._events[event]) {
      this._events[event] = this._events[event].filter(l => l !== listener && l.listener !== listener);
    }
    return this;
  }
  emit(event, ...args) {
    const listeners = this._events[event];
    if (!listeners || listeners.length === 0) return false;
    listeners.slice().forEach(l => l(...args));
    return true;
  }
  addListener(event, listener) { return this.on(event, listener); }
  removeListener(event, listener) { return this.off(event, listener); }
  removeAllListeners(event) {
    if (event) delete this._events[event];
    else this._events = {};
    return this;
  }
  listeners(event) { return (this._events[event] || []).slice(); }
  rawListeners(event) { return this.listeners(event); }
  listenerCount(event) { return (this._events[event] || []).length; }
  setMaxListeners(n) { this._maxListeners = n; return this; }
  getMaxListeners() { return this._maxListeners; }
  prependListener(event, listener) {
    (this._events[event] = this._events[event] || []).unshift(listener);
    return this;
  }
  prependOnceListener(event, listener) {
    const wrapped = (...args) => {
      this.off(event, wrapped);
      listener(...args);
    };
    wrapped.listener = listener;
    return this.prependListener(event, wrapped);
  }
  eventNames() { return Object.keys(this._events); }
}

EventEmitter.EventEmitter = EventEmitter;
EventEmitter.defaultMaxListeners = 10;

const once = (emitter, event) => new Promise((resolve, reject) => {
  const onEvent = (...args) => { cleanup(); resolve(args); };
  const onError = (err) => { cleanup(); reject(err); };
  const cleanup = () => {
    emitter.off(event, onEvent);
    emitter.off('error', onError);
  };
  emitter.once(event, onEvent);
  emitter.once('error', onError);
});

export default EventEmitter;
export { EventEmitter, once };
