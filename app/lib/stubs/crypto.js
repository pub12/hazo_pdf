// crypto stub for browser (minimal - uses Web Crypto API where possible)
const crypto = {
  randomBytes: (size) => {
    const bytes = new Uint8Array(size);
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    }
    return bytes;
  },
  createHash: (algorithm) => ({
    update: function() { return this; },
    digest: (encoding) => encoding === 'hex' ? '0'.repeat(64) : Buffer.alloc(32),
  }),
  createHmac: (algorithm, key) => ({
    update: function() { return this; },
    digest: (encoding) => encoding === 'hex' ? '0'.repeat(64) : Buffer.alloc(32),
  }),
  randomUUID: () => {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },
  getRandomValues: (array) => {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      return globalThis.crypto.getRandomValues(array);
    }
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};
export default crypto;
export const { randomBytes, createHash, createHmac, randomUUID, getRandomValues } = crypto;
