// path stub for browser
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
  format: (obj) => `${obj.dir || ''}/${obj.base || ''}`,
  isAbsolute: (p) => p.startsWith('/'),
  relative: (from, to) => to,
  normalize: (p) => p.replace(/\/+/g, '/'),
  sep: '/',
  delimiter: ':',
};
path.posix = path;
path.win32 = path;
export default path;
export const { join, resolve, dirname, basename, extname, parse, format, isAbsolute, relative, normalize, sep, delimiter, posix, win32 } = path;
