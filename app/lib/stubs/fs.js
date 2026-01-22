// fs stub for browser
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
  mkdir: (path, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    if (cb) cb(new Error('fs not available in browser'));
  },
  readdirSync: () => [],
  statSync: () => ({ isDirectory: () => false, isFile: () => false }),
  stat: (path, callback) => callback(new Error('fs not available in browser')),
  lstat: (path, callback) => callback(new Error('fs not available in browser')),
  access: (path, mode, callback) => {
    const cb = typeof mode === 'function' ? mode : callback;
    if (cb) cb(new Error('fs not available in browser'));
  },
  createReadStream: () => ({ on: () => {}, pipe: () => {}, destroy: () => {} }),
  createWriteStream: () => ({ on: () => {}, write: () => true, end: () => {}, destroy: () => {} }),
  unlink: (path, callback) => callback(new Error('fs not available in browser')),
  unlinkSync: () => { throw new Error('fs not available in browser'); },
  rename: (oldPath, newPath, callback) => callback(new Error('fs not available in browser')),
  renameSync: () => { throw new Error('fs not available in browser'); },
  chmod: (path, mode, callback) => callback(new Error('fs not available in browser')),
  chmodSync: () => { throw new Error('fs not available in browser'); },
  promises: {
    readFile: () => Promise.reject(new Error('fs not available in browser')),
    writeFile: () => Promise.reject(new Error('fs not available in browser')),
    access: () => Promise.reject(new Error('fs not available in browser')),
    stat: () => Promise.reject(new Error('fs not available in browser')),
    mkdir: () => Promise.reject(new Error('fs not available in browser')),
    readdir: () => Promise.reject(new Error('fs not available in browser')),
    unlink: () => Promise.reject(new Error('fs not available in browser')),
    rename: () => Promise.reject(new Error('fs not available in browser')),
  },
  constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1, COPYFILE_EXCL: 1 },
};
export default fs;
export const {
  readFile, readFileSync, writeFile, writeFileSync, existsSync,
  mkdirSync, mkdir, readdirSync, statSync, stat, lstat, access,
  createReadStream, createWriteStream, unlink, unlinkSync,
  rename, renameSync, chmod, chmodSync, promises, constants
} = fs;
