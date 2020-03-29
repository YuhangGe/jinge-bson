import {
  serialize
} from './util';

function generateTestIntegers(min: number, max: number, count: number = 5): number[] {
  return [min, max, ...(new Array(count)).fill(0).map(() => {
    return min + 1 + Math.floor(Math.random() * (max - min - 1));
  })];
}

describe('serialize integer elements', () => {
  test('positive 8bits integers', () => {
    generateTestIntegers(4, 255).forEach(v => {
      const r = serialize(v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(0);
      expect((r.elTag & 0b1110) >> 1).toBe(0);
      expect(r.elBody.byteLength).toBe(1);
      expect(r.elBody.getUint8(0)).toBe(v);
    });
  });

  test('negative 8bits integers', () => {
    generateTestIntegers(4, 255).forEach(v => {
      const r = serialize(-v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(1);
      expect((r.elTag & 0b1110) >> 1).toBe(0);
      expect(r.elBody.byteLength).toBe(1);
      expect(r.elBody.getUint8(0)).toBe(v);
    });
  });

  test('positive 16bits integers', () => {
    generateTestIntegers(256, 0xffff).forEach(v => {
      const r = serialize(v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(0);
      expect((r.elTag & 0b1110) >> 1).toBe(1);
      expect(r.elBody.byteLength).toBe(2);
      expect(r.elBody.getUint16(0, false)).toBe(v);
    });
  });

  test('negative 16bits integers', () => {
    generateTestIntegers(256, 0xffff).forEach(v => {
      const r = serialize(-v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(1);
      expect((r.elTag & 0b1110) >> 1).toBe(1);
      expect(r.elBody.byteLength).toBe(2);
      expect(r.elBody.getUint16(0, false)).toBe(v);
    });
  });

  test('positive 24bits integers', () => {
    generateTestIntegers(0xffff + 1, 0xffffff).forEach(v => {
      const r = serialize(v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(0);
      expect((r.elTag & 0b1110) >> 1).toBe(2);
      expect(r.elBody.byteLength).toBe(3);
      expect(r.elBody.getUint8(0)).toBe((v & 0xff0000) >> 16);
      expect(r.elBody.getUint16(1, false)).toBe(v & 0xffff);
    });
  });

  test('negative 24bits integers', () => {
    generateTestIntegers(0xffff + 1, 0xffffff).forEach(v => {
      const r = serialize(-v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(1);
      expect((r.elTag & 0b1110) >> 1).toBe(2);
      expect(r.elBody.byteLength).toBe(3);
      expect(r.elBody.getUint8(0)).toBe((v & 0xff0000) >> 16);
      expect(r.elBody.getUint16(1, false)).toBe(v & 0xffff);
    });
  });

  test('positive 32bits integers', () => {
    generateTestIntegers(0xffffff + 1, 0xffffffff).forEach(v => {
      const r = serialize(v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(0);
      expect((r.elTag & 0b1110) >> 1).toBe(3);
      expect(r.elBody.byteLength).toBe(4);
      expect(r.elBody.getUint32(0, false)).toBe(v);
    });
  });

  test('negative 32bits integers', () => {
    generateTestIntegers(0xffffff + 1, 0xffffffff).forEach(v => {
      const r = serialize(-v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(1);
      expect((r.elTag & 0b1110) >> 1).toBe(3);
      expect(r.elBody.byteLength).toBe(4);
      expect(r.elBody.getUint32(0, false)).toBe(v);
    });
  });

  test('positive 64bits integers', () => {
    generateTestIntegers(0xffffffff + 1, Number.MAX_SAFE_INTEGER, 100).forEach(v => {
      const r = serialize(v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(0);
      expect((r.elTag & 0b1110) >> 1).toBe(7);
      expect(r.elBody.byteLength).toBe(8);
      expect(r.elBody.getBigUint64(0, false)).toBe(BigInt(v));
    });
  });

  test('negative 64bits integers', () => {
    generateTestIntegers(0xffffffff + 1, Number.MAX_SAFE_INTEGER, 100).forEach(v => {
      const r = serialize(-v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(1);
      expect((r.elTag & 0b1110) >> 1).toBe(7);
      expect(r.elBody.byteLength).toBe(8);
      expect(r.elBody.getBigUint64(0, false)).toBe(BigInt(v));
    });
  });

  test('positive 64bits big-integers', () => {
    const min = BigInt('0xffffffff') + 1n;
    const max = BigInt('0xffffffffffffffff');
    const arr = new Array(100).fill(0).map(() => {
      return min + 1n + BigInt(Math.floor(Math.random() * 0xfffffff0));
    });
    [min, ...arr, max].forEach(v => {
      const r = serialize(v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(0);
      expect((r.elTag & 0b1110) >> 1).toBe(7);
      expect(r.elBody.byteLength).toBe(8);
      expect(r.elBody.getBigUint64(0, false)).toBe(v);
    });
  });


  test('negative 64bits big-integers', () => {
    const min = BigInt('0xffffffff') + 1n;
    const max = BigInt('0xffffffffffffffff');
    const arr = new Array(100).fill(0).map(() => {
      return min + 1n + BigInt(Math.floor(Math.random() * 0xfffffff0));
    });
    [min, ...arr, max].forEach(v => {
      const r = serialize(-v);
      expect(r.elType).toBe(1);
      expect((r.elTag & 0b0001)).toBe(1);
      expect((r.elTag & 0b1110) >> 1).toBe(7);
      expect(r.elBody.byteLength).toBe(8);
      expect(r.elBody.getBigUint64(0, false)).toBe(v);
    });
  });
});
