// string_decoder stub for browser
class StringDecoder {
  constructor(encoding) {
    this.encoding = encoding || 'utf8';
  }
  write(buffer) {
    if (typeof buffer === 'string') return buffer;
    if (buffer instanceof Uint8Array || buffer instanceof ArrayBuffer) {
      return new TextDecoder(this.encoding).decode(buffer);
    }
    if (buffer && buffer.toString) return buffer.toString(this.encoding);
    return String(buffer);
  }
  end(buffer) {
    return buffer ? this.write(buffer) : '';
  }
}

export { StringDecoder };
export default { StringDecoder };
