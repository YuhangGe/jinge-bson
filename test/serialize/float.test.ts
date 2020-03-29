import {
  serialize
} from './util';


describe('serialize integer elements', () => {
  test('32bits float', () => {
    const r = serialize(Math.PI);
    expect(r.elType).toBe(2);
    expect((r.elTag & 0b0001)).toBe(0);
    expect(r.elBody.byteLength).toBe(4);
    expect(r.elBody.getFloat32(0, false).toFixed(6)).toBe('3.141593');
  });

  test('64bits float', () => {
    const r = serialize(Math.PI, {floatPrecision: 'double'});
    expect(r.elType).toBe(2);
    expect((r.elTag & 0b0001)).toBe(1);
    expect(r.elBody.byteLength).toBe(8);
    expect(r.elBody.getFloat64(0, false).toFixed(12)).toBe('3.141592653590');
  });

});