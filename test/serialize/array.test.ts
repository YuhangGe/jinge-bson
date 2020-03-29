import {
  serialize,
  isArrayBufferEqual,
  readIntegerFns
} from './util';

describe('serialize array elements', () => {
  test('empty array', () => {
    const r = serialize([]);
    expect(r.elType).toBe(4);
    expect((r.elTag & 0b0001)).toBe(1);
    expect((r.elTag & 0b0110) >> 1).toBe(0);
    expect(r.elBody.byteLength).toBe(0);
  });


  test('same micro array', () => {
    [
      0, 1, 4657487333, Math.PI, true, false, new Boolean(true), new Boolean(false), null, undefined
    ].forEach(v => {
      const len = (Math.random() * 3 | 0) + 1;
      const r = serialize(new Array(len).fill(v));
      expect(r.elType).toBe(4);
      expect((r.elTag & 0b0001)).toBe(1);
      expect((r.elTag & 0b0110) >> 1).toBe(len);
      expect((r.elTag & 0b1000) >> 3).toBe(1);
      const ir = serialize(v);
      expect(isArrayBufferEqual(r.elBody.buffer, ir.buffer)).toBe(true);
    });
  });

  test('same array', () => {
    [
      0, 1, 4657487333, Math.PI, true, false, new Boolean(true), new Boolean(false), null, undefined
    ].forEach(v => {
      const size = (Math.random() * 3 + 1) | 0;
      const len = parseInt((new Array(size).fill(0).map(() => {
        return size === 1 ? 'ee' : '01';
      })).join(''), 16);

      const r = serialize(new Array(len).fill(v));
      expect(r.elType).toBe(4);
      expect((r.elTag & 0b0001)).toBe(0);
      expect((r.elTag & 0b0110) >> 1).toBe(size - 1);
      expect(readIntegerFns[size - 1](r.elBody, 0)).toBe(len);
      expect((r.elTag & 0b1000) >> 3).toBe(1);
      const ir = serialize(v);
      expect(isArrayBufferEqual(r.elBody.buffer.slice(size), ir.buffer)).toBe(true);
    });
  });

  test('different micro array', () => {
    const arr = [0, Math.PI, true];
    const r = serialize(arr);
    expect(r.elType).toBe(4);
    expect((r.elTag & 0b0001)).toBe(1);
    expect((r.elTag & 0b0110) >> 1).toBe(arr.length);
    expect((r.elTag & 0b1000) >> 3).toBe(0);

    let offset = 0;
    arr.forEach(it => {
      const et = serialize(it);
      expect(isArrayBufferEqual(r.elBody.buffer.slice(offset, offset + et.buffer.byteLength), et.buffer)).toBe(true);
      offset += et.buffer.byteLength;
    });
  });

  test('same string array', () => {
    const r = serialize(['abc', 'abc', 'abc']);
    expect(r.dict).not.toBeNull();
    expect(r.dict.length).toBe(1);
    expect(r.dict[0]).toBe('abc');
    expect(r.elType).toBe(4);
    expect((r.elTag & 0b0001)).toBe(1);
    expect((r.elTag & 0b0110) >> 1).toBe(3);
    expect((r.elTag & 0b1000) >> 3).toBe(1);
    expect(r.elBody.byteLength).toBe(2);
    expect(r.elBody.getUint8(1)).toBe(0);
  });

  test('different string array', () => {
    const r = serialize(['abc', 'abc', '静', '静格设计', '静']);
    expect(r.dict).not.toBeNull();
    expect(r.dict.length).toBe(2);
    expect(r.dict).toStrictEqual(['abc', '静']);
    expect(r.elType).toBe(4);
    expect((r.elTag & 0b0001)).toBe(0);
    expect((r.elTag & 0b0110) >> 1).toBe(0);
    expect((r.elTag & 0b1000) >> 3).toBe(0);
  });
});