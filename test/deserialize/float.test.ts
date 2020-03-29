import { serialize, deserialize } from '../../src';


describe('deserialize float elements', () => {

  test('32bits float', () => {
    const bson = serialize(Math.PI);
    const json = deserialize(bson);
    expect(json.toFixed(7)).toBe('3.1415927');
  });

  test('64bits float', () => {
    const bson = serialize(Math.PI, {
      floatPrecision: 'double'
    });
    const json = deserialize(bson);
    expect(json).toStrictEqual(Math.PI);
  });

});