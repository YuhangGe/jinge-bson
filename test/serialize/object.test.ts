import {
  serialize, readIntegerFns
} from './util';

describe('serialize object elements', () => {
  test('empty object', () => {
    const r = serialize({});
    expect(r.elType).toBe(5);
    expect(r.elTag & 0b0001).toBe(1);
    expect((r.elTag & 0b1110) >> 1).toBe(0);
  });

  test('micro object', () => {
    const r = serialize({
      width: 10,
      height: 0x1234
    });
    expect(r.elType).toBe(5);
    expect(r.elTag & 0b0001).toBe(1);
    expect((r.elTag & 0b1110) >> 1).toBe(2);
    expect(r.elBody.byteLength).toBe(20);
  });


  test('2 bytes size properties', () => {
    const obj = Object.fromEntries(new Array(0x1234).fill(0).map((n, i) => {
      return [`p${i}`, i];
    }));
    const r = serialize(obj);
    expect(r.elType).toBe(5);
    expect(r.elTag & 0b0001).toBe(0);
    expect((r.elTag & 0b0110) >> 1).toBe(1);
    expect(readIntegerFns[(r.elTag & 0b0110) >> 1](r.elBody, 0)).toBe(0x1234);
    expect(r.elBody.getUint8(2)).toBe((3 << 4) | 0b0110);
    expect(r.elBody.getUint8(5)).toBe(0b10);
  });
});
