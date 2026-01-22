// readline stub for browser
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
export default readline;
export const { createInterface, cursorTo, clearLine, clearScreenDown, moveCursor } = readline;
