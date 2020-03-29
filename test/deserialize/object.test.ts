import {
  serializeThenDeserializeThenAssertEqual
} from './util';

describe('serialize object elements', () => {
  test('empty object', () => {
    serializeThenDeserializeThenAssertEqual({});
  });

  test('micro object', () => {
    serializeThenDeserializeThenAssertEqual({
      width: 10,
      height: 0x1234
    });
  });

  test('2 bytes size properties', () => {
    const obj = Object.fromEntries(new Array(0x1234).fill(0).map((n, i) => {
      return [`prop-${i}`, (Math.random() * 0x123456) | 0];
    }));
    serializeThenDeserializeThenAssertEqual(obj);
  });

  test('special property', () => {
    serializeThenDeserializeThenAssertEqual({
      ['']: 'yes',
      ['\x01']: ['\x01', '\x02']
    });
  });
});
