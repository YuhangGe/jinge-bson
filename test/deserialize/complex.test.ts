import {
  serializeThenDeserializeThenAssertEqual
} from './util';

function makeObj(): unknown {
  const ooo = Object.fromEntries(new Array(0x124).fill(0).map((n, i) => {
    return [`p${i}`, i];
  }));
  const obj = {
    name: '静格(jinge)',
    age: 18,
    ooo,
    pi: Math.PI,
    father: {
      name: 'Abe',
      male: true,
      ooo,
      cities: [null, undefined, {
        [new Array(0x1234).fill('a').join('')]: 'nice'
      }, [
        {w: 10, k: true}
      ]],
      arr1: [[[]], [3]],
      arr2: [1, Math.PI, 3,5, true, {x: null}],
      points: [{width: 10, height: 456}, {width: 98883, height: 0}]
    }
  };
  return obj;
}

describe('deserialize complex json', () => {
  test('large dictionary', () => {
    const arr = ['', 1, true, null, new Array(0x234).fill('a').join('')];
    serializeThenDeserializeThenAssertEqual({
      a: arr,
      [arr.join('-')]: arr
    });
  });

  test('nested object', () => {
    serializeThenDeserializeThenAssertEqual(makeObj(),  {
      floatPrecision: 'double'
    });
  });

  
  test('custom buffer page size', () => {
    serializeThenDeserializeThenAssertEqual(makeObj(), {
      floatPrecision: 'double',
      bufferPageSize: 6
    });
  });
});
