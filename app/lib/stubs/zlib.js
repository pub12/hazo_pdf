// zlib stub for browser
import stream from './stream.js';

const { Transform } = stream;

const zlib = {
  createGzip: () => new Transform(),
  createGunzip: () => new Transform(),
  createDeflate: () => new Transform(),
  createInflate: () => new Transform(),
  createDeflateRaw: () => new Transform(),
  createInflateRaw: () => new Transform(),
  createBrotliCompress: () => new Transform(),
  createBrotliDecompress: () => new Transform(),
  gzip: (data, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    if (cb) cb(null, data);
  },
  gunzip: (data, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    if (cb) cb(null, data);
  },
  deflate: (data, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    if (cb) cb(null, data);
  },
  inflate: (data, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    if (cb) cb(null, data);
  },
  gzipSync: (data) => data,
  gunzipSync: (data) => data,
  deflateSync: (data) => data,
  inflateSync: (data) => data,
  constants: {
    Z_NO_COMPRESSION: 0,
    Z_BEST_SPEED: 1,
    Z_BEST_COMPRESSION: 9,
    Z_DEFAULT_COMPRESSION: -1,
  },
};

export default zlib;
export const {
  createGzip, createGunzip, createDeflate, createInflate,
  createDeflateRaw, createInflateRaw, createBrotliCompress, createBrotliDecompress,
  gzip, gunzip, deflate, inflate, gzipSync, gunzipSync, deflateSync, inflateSync, constants
} = zlib;
