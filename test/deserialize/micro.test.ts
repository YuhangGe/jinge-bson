import { serializeThenDeserializeThenAssertEqual } from './util';

describe('deserialize micro elements', () => {
  test('micro integers: zero', () => {
    serializeThenDeserializeThenAssertEqual(0);  
  });

  test('micro integers: 1 ~ 3', () => {
    for(let i = 1; i <= 3; i++) {
      serializeThenDeserializeThenAssertEqual(i);
    }
  });

  test('micro integers: -3 ~ -1', () => {
    for(let i = -3; i <= -1; i++) {
      serializeThenDeserializeThenAssertEqual(i);
    }
  });

  test('null & undefined', () => {
    [null, undefined].forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('true & false', () => {
    [true, false].forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });
});
