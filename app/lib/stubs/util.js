// util stub for browser
const util = {
  inherits: (ctor, superCtor) => {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  },
  promisify: (fn) => (...args) => new Promise((resolve, reject) => {
    fn(...args, (err, result) => err ? reject(err) : resolve(result));
  }),
  callbackify: (fn) => (...args) => {
    const callback = args.pop();
    fn(...args).then(result => callback(null, result), err => callback(err));
  },
  inspect: (obj, opts) => {
    try { return JSON.stringify(obj, null, 2); }
    catch { return String(obj); }
  },
  format: (fmt, ...args) => {
    if (typeof fmt !== 'string') return [fmt, ...args].map(String).join(' ');
    let i = 0;
    return fmt.replace(/%[sdjifoO%]/g, (match) => {
      if (match === '%%') return '%';
      if (i >= args.length) return match;
      const arg = args[i++];
      switch (match) {
        case '%s': return String(arg);
        case '%d': case '%i': return parseInt(arg, 10);
        case '%f': return parseFloat(arg);
        case '%j': return JSON.stringify(arg);
        case '%o': case '%O': return util.inspect(arg);
        default: return match;
      }
    });
  },
  debuglog: (section) => () => {},
  deprecate: (fn, msg) => fn,
  isDeepStrictEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  types: {
    isDate: (v) => v instanceof Date,
    isRegExp: (v) => v instanceof RegExp,
    isNativeError: (v) => v instanceof Error,
    isPromise: (v) => v instanceof Promise,
    isArrayBuffer: (v) => v instanceof ArrayBuffer,
    isTypedArray: (v) => ArrayBuffer.isView(v) && !(v instanceof DataView),
  },
  TextEncoder: globalThis.TextEncoder,
  TextDecoder: globalThis.TextDecoder,
};

export default util;
export const { inherits, promisify, callbackify, inspect, format, debuglog, deprecate, isDeepStrictEqual, types, TextEncoder, TextDecoder } = util;
