import { Context } from './helper';
import { parseDictionary, loopParse } from './reader';

export function deserialize(bson: ArrayBuffer): unknown {
  if (!bson || bson.byteLength <= 0) {
    throw new Error('buffer empty');
  }
  const ctx = new Context(bson);
  const head = ctx.v.getUint8(ctx.o);
  if (((head & 0xf0) >> 4) === 6) {
    ctx.o++;
    parseDictionary(ctx, head & 0x0f);
  }
  const result = loopParse(ctx);
  if (ctx.o !== ctx.v.buffer.byteLength) {
    throw new Error('buffer overflow');
  }
  return result;
}