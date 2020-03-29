import {
  transferArrayBuffer, getType
} from '../../src/serialize/helper';
import { serialize } from '../../src';

describe('buffer functions', () => {
  test('transferArrayBuffer', () => {
    let buf = new ArrayBuffer(0);
    buf = transferArrayBuffer(buf, 10);
    expect(buf.byteLength).toBe(10);
    buf = transferArrayBuffer(buf, 5);
    expect(buf.byteLength).toBe(5);
  });

  test('mock native ArrayBuffer.transfer', () => {
    let hasNativeFn = true;
    if (!ArrayBuffer.transfer) {
      hasNativeFn = false;
      ArrayBuffer.transfer = function(source: ArrayBuffer, length: number): ArrayBuffer {
        return new ArrayBuffer(length);
      };
    }
    let buf = new ArrayBuffer(0);
    buf = transferArrayBuffer(buf, 10);
    expect(buf.byteLength).toBe(10);
    if (!hasNativeFn) {
      delete ArrayBuffer.transfer;
    }
  });

  test('getType', () => {
    expect(getType(10)).toBe('integer');
    expect(getType(Math.PI)).toBe('float');
  });

  test('custom buffer page size', () => {
    const r = serialize(Math.PI, {
      bufferPageSize: 1
    });
    expect(r.byteLength).toBe(5);
  });
});

