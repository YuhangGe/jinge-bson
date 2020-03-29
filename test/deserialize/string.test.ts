import {
  serializeThenDeserializeThenAssertEqual
} from './util';

describe('deserialize string elements', () => {
  test('empty string', () => {
    serializeThenDeserializeThenAssertEqual('');
  });

  test('micro strings', () => {
    ['a', '\u3282', 'ab', 'abc', 'abcd', '静'].forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('one byte size strings', () => {
    ['hello, world', new Array(255).fill('a').join('')].forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('two bytes size strings', () => {
    [new Array(256).fill('a').join(''), new Array(0xffff).fill('a').join('')].forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

  test('three bytes size strings', () => {
    [new Array(0xffff + 1).fill('a').join('')].forEach(v => {
      serializeThenDeserializeThenAssertEqual(v);
    });
  });

});