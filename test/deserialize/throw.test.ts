import {
  deserialize,
  serialize
} from '../../src';

describe('deserialze throw errors', () => {
  test('buffer empty', () => {
    expect(() => deserialize()).toThrow('buffer empty');
    expect(() => deserialize(new ArrayBuffer(0))).toThrow('buffer empty');
  });

  test('buffer overflow', () => {
    expect(() => deserialize(new ArrayBuffer(10))).toThrow('buffer overflow');
  });

  test('unsupport type', () => {
    const v = new Uint8Array(1);
    v[0] = 7 << 4;
    expect(() => deserialize(v.buffer)).toThrow('unsupport type: 7');
  });

  test('unsupport integer size', () => {
    const v = new Uint8Array(4);
    v[0] = (1 << 4) | 0b1100;
    expect(() => deserialize(v.buffer)).toThrow('unsupport integer size: 6');
  });

  test('string index overflow', () => {
    const r = serialize(['aaa', 'aaa', 'bbb']);
    const dv = new Uint8Array(r);
    dv[7] = 2;
    expect(() => {
      deserialize(r);
    }).toThrow('string index overflow');
  });
});
