import {
  serializeThenDeserializeThenAssertEqual
} from './util';


describe('serialize array elements', () => {
  test('empty array', () => {
    serializeThenDeserializeThenAssertEqual([]);
  });


  test('same micro array', () => {
    [
      0, 1, 4657487333, Math.PI, true, false, null, undefined
    ].forEach(v => {
      const len = (Math.random() * 3 | 0) + 1;
      serializeThenDeserializeThenAssertEqual(
        new Array(len).fill(v),
        { floatPrecision: 'double' }
      );
    });
  });

  test('same array', () => {
    [
      0, 1, 4657487333, Math.PI, true, false, null, undefined
    ].forEach(v => {
      const size = (Math.random() * 3 + 1) | 0;
      const len = parseInt((new Array(size).fill(0).map(() => {
        return size === 1 ? 'ee' : '01';
      })).join(''), 16);
      serializeThenDeserializeThenAssertEqual(
        new Array(len).fill(v),
        { floatPrecision: 'double' }
      );
    });
  });

  test('different micro array', () => {
    const arr = [0, Math.PI, true];
    serializeThenDeserializeThenAssertEqual(arr, {
      floatPrecision: 'double'
    });
  });

  test('same string array', () => {
    serializeThenDeserializeThenAssertEqual(['abc', 'abc', 'abc']);
  });

  test('different string array', () => {
    serializeThenDeserializeThenAssertEqual(['abc', 'abc', '123', 'abc', '静', '123', '静', '静格设计', '静', '静']);
  });

});