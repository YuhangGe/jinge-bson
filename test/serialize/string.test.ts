import {
  serialize
} from './util';

describe('serialize string elements', () => {
  test('empty string', () => {
    const r = serialize('');
    expect(r.elType).toBe(3);
    expect((r.elTag & 0b0011)).toBe(3);
    expect(r.elBody.byteLength).toBe(0);
  });

  test('micro strings', () => {
    ['a', '\u3282', 'ab', 'abc', 'abcd', '静'].forEach(v => {
      const tb = new TextEncoder().encode(v);
      const r = serialize(v);
      expect(r.elType).toBe(3);
      expect((r.elTag & 0b0011)).toBe(2);
      expect((r.elTag & 0b1100) >> 2).toBe(tb.length - 1);
      expect(r.elBody.byteLength).toBe(tb.length);
      expect(new TextDecoder().decode(r.elBody.buffer)).toBe(v);
    });
  });

  test('one byte size strings', () => {
    ['hello, world', new Array(255).fill('a').join('')].forEach(v => {
      const tb = new TextEncoder().encode(v);
      const r = serialize(v);
      expect(r.elType).toBe(3);
      expect((r.elTag & 0b0011)).toBe(0);
      expect((r.elTag & 0b1100) >> 2).toBe(0);
      expect(r.elBody.byteLength).toBe(tb.length + 1);
      expect(r.elBody.getUint8(0)).toBe(tb.length);
      expect(new TextDecoder().decode(r.elBody.buffer.slice(1))).toBe(v);
    });
  });

  test('two bytes size strings', () => {
    [new Array(256).fill('a').join(''), new Array(0xffff).fill('a').join('')].forEach(v => {
      const tb = new TextEncoder().encode(v);
      const r = serialize(v);
      expect(r.elType).toBe(3);
      expect((r.elTag & 0b0011)).toBe(0);
      expect((r.elTag & 0b1100) >> 2).toBe(1);
      expect(r.elBody.byteLength).toBe(tb.length + 2);
      expect(r.elBody.getUint16(0, false)).toBe(tb.length);
      expect(new TextDecoder().decode(r.elBody.buffer.slice(2))).toBe(v);
    });
  });

  test('three bytes size strings', () => {
    [new Array(0xffff + 1).fill('a').join('')].forEach(v => {
      const tb = new TextEncoder().encode(v);
      const r = serialize(v);
      expect(r.elType).toBe(3);
      expect((r.elTag & 0b0011)).toBe(0);
      expect((r.elTag & 0b1100) >> 2).toBe(2);
      expect(r.elBody.byteLength).toBe(tb.length + 3);
      expect((r.elBody.getUint8(0) << 16) | r.elBody.getUint16(1, false)).toBe(tb.length);
      expect(new TextDecoder().decode(r.elBody.buffer.slice(3))).toBe(v);
    });
  });

});