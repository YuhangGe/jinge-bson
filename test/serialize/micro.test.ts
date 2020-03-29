import {
  serialize
} from './util';

describe('serialize micro elements', () => {

  test('micro integers: zero', () => {
    const r = serialize(0);
    expect(r.elType).toBe(0);
    expect((r.elTag & 0b11)).toBe(2);
    expect((r.elTag & 0b1100) >> 2).toBe(0);      
  });

  test('micro integers: 1 ~ 3', () => {
    for(let i = 1; i <= 3; i++) {
      const r = serialize(i);
      expect(r.elType).toBe(0);
      expect((r.elTag & 0b11)).toBe(2);
      expect((r.elTag & 0b1100) >> 2).toBe(i);
    }
  });

  test('micro integers: -3 ~ -1', () => {
    for(let i = -3; i <= -1; i++) {
      const r = serialize(i);
      expect(r.elType).toBe(0);
      expect((r.elTag & 0b11)).toBe(3);
      expect((r.elTag & 0b1100) >> 2).toBe(-i);
    }
  });

  test('null & undefined', () => {
    [null, undefined].forEach(v => {
      const r = serialize(v);
      expect(r.elType).toBe(0);
      expect((r.elTag & 0b11)).toBe(1);
      expect((r.elTag & 0b1100) >> 2).toBe(v === undefined ? 0 : 1);
    });
  });

  test('true & false', () => {
    [true, false, new Boolean(true), new Boolean(false)].forEach(v => {
      const r = serialize(v);
      expect(r.elType).toBe(0);
      expect((r.elTag & 0b11)).toBe(0);
      expect((r.elTag & 0b1100) >> 2).toBe(
        (v instanceof Boolean ? v.valueOf() : v) ? 1 : 0
      );
    });
  });
});

