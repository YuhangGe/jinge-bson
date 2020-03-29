import {
  serialize
} from '../../src';
import {
  writeIntegerBody,
  writeString
} from '../../src/serialize/writer';
import {
  Context
} from '../../src/serialize/helper';

describe('serialze throw errors', () => {
  test('unsupport size of integer', () => {
    const ctx = new Context();
    expect(() => writeIntegerBody(ctx, 0xffffffff0, 5)).toThrow('unsupport size of integer');
  });

  test('string not found', () => {
    const ctx = new Context();
    expect(() => writeString(ctx, 'hello')).toThrow();
    ctx.d = new Map();
    expect(() => writeString(ctx, 'hello')).toThrow('string not found');
  });

  test('unsupport value type', () => {
    expect(() => serialize(() => {/**/})).toThrow('unsupport value type: function');
  });

  test('unsupport integers', () => {
    expect(() => serialize(NaN)).toThrow('do not support NaN or Infinity');
    expect(() => serialize(Infinity)).toThrow('do not support NaN or Infinity');
    expect(() => serialize(-Infinity)).toThrow('do not support NaN or Infinity');
    expect(() => serialize(Number.MAX_SAFE_INTEGER + 1)).toThrow('integer is not safe, use bigint instead.');
  });

});
