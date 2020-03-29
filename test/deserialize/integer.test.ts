import {
  serializeThenDeserializeThenAssertEqual
} from './util';

function generateTestIntegers(min: number, max: number, count: number = 5): number[] {
  return [min, max, ...(new Array(count)).fill(0).map(() => {
    return min + 1 + Math.floor(Math.random() * (max - min - 1));
  })];
}

describe('deserialize integer elements', () => {
  test('positive 8bits integers', () => {
    generateTestIntegers(4, 255).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('negative 8bits integers', () => {
    generateTestIntegers(4, 255).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('positive 16bits integers', () => {
    generateTestIntegers(256, 0xffff).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('negative 16bits integers', () => {
    generateTestIntegers(256, 0xffff).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('positive 24bits integers', () => {
    generateTestIntegers(0xffff + 1, 0xffffff).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('negative 24bits integers', () => {
    generateTestIntegers(0xffff + 1, 0xffffff).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('positive 32bits integers', () => {
    generateTestIntegers(0xffffff + 1, 0xffffffff).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('negative 32bits integers', () => {
    generateTestIntegers(0xffffff + 1, 0xffffffff).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('positive 64bits integers', () => {
    generateTestIntegers(0xffffffff + 1, Number.MAX_SAFE_INTEGER, 100).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('negative 64bits integers', () => {
    generateTestIntegers(0xffffffff + 1, Number.MAX_SAFE_INTEGER, 100).forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('positive 64bits big-integers', () => {
    const min = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    const max = BigInt('0xffffffffffffffff');
    const arr = new Array(100).fill(0).map(() => {
      return min + 1n + BigInt(Math.floor(Math.random() * 0xfffffff0));
    });
    [min, ...arr, max].forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });


  test('negative 64bits big-integers', () => {
    const min = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    const max = BigInt('0xffffffffffffffff');
    const arr = new Array(100).fill(0).map(() => {
      return min + 1n + BigInt(Math.floor(Math.random() * 0xfffffff0));
    });
    [min, ...arr, max].forEach(v => {
      serializeThenDeserializeThenAssertEqual(-v);
    });
  });
});
