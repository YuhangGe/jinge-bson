import {
  prepareArrayBuffer, Context, getByteSizeOfInteger, Dict, isArrayItemsSame, getType
} from './helper';

export function writeUint8(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 1);
  ctx.v.setUint8(ctx.o++, v);
}

export function writeUint16(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 2);
  ctx.v.setUint16(ctx.o, v, false);
  ctx.o += 2;
}

export function writeUint24(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 3);
  ctx.v.setUint8(ctx.o++, (v & 0x00ff0000) >> 16);
  ctx.v.setUint16(ctx.o, (v & 0x0000ffff), false);
  ctx.o += 2;
}

export function writeUint32(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 4);
  ctx.v.setUint32(ctx.o, v, false);
  ctx.o += 4;
}

export function writeUint64(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 8);
  ctx.v.setBigUint64(ctx.o, BigInt(v), false);
  ctx.o += 8;
}

export function writeElementHead(ctx: Context, type: number, tag: number): void {
  writeUint8(ctx, ((type & 0x0f) << 4) | (tag & 0x0f));
}

export function writeMicro(ctx: Context, type: number, value: number): void {
  const tag = type << 2 | value;
  writeElementHead(ctx, 0, tag);
}

export function writeFloat(ctx: Context, v: number, useDoubleFloatPrecision: boolean): void {
  writeElementHead(ctx, 2, useDoubleFloatPrecision ? 1 : 0);
  if (useDoubleFloatPrecision) {
    ctx.v.setFloat64(ctx.o, v, false);
    ctx.o += 8;
  } else {
    ctx.v.setFloat32(ctx.o, v, false);
    ctx.o += 4;
  }
}

export function writeIntegerBody(ctx: Context, v: number, size: number): void {
  if (size === 8) {
    writeUint64(ctx, v);
  } else if (size === 4) {
    writeUint32(ctx, v);
  } else if (size === 3) {
    writeUint24(ctx, v);
  } else if (size === 2) {
    writeUint16(ctx, v);
  } else if (size === 1) {
    writeUint8(ctx, v);
  } else {
    throw new Error('unsupport size of integer.');
  }
}

export function writeInteger(ctx: Context, v: number | bigint): void {
  const negative = v < 0;
  if (negative) {
    v = -v;
  }
  if (v <= 3) {
    return writeMicro(ctx, negative ? 3 : 2, v as number);
  }
  const size = getByteSizeOfInteger(v);
  writeElementHead(ctx, 1, ((size - 1) << 1) | (negative ? 1 : 0));
  writeIntegerBody(ctx, v as number, size);
}

export function writeStringBody(ctx: Context, s: Dict): void {
  prepareArrayBuffer(ctx, s.b.byteLength);
  const target = new Uint8Array(ctx.v.buffer);
  target.set(
    new Uint8Array(s.b),
    ctx.o
  );
  ctx.o += s.b.byteLength;
}

export function writeString(ctx: Context, v: string): void {
  if (v.length === 0) {
    return writeElementHead(ctx, 3, 3);
  }
  const s = ctx.d.get(v);
  if (!s)  throw new Error('string not found!');
  if (s.b.byteLength > 1 && s.i >= 0) {
    const indexSize = getByteSizeOfInteger(s.i);
    writeElementHead(ctx, 3, ((indexSize - 1) << 2) | 1);
    writeIntegerBody(ctx, s.i, indexSize);
    return;
  }
  if (s.b.byteLength <= 4) {
    writeElementHead(ctx, 3, ((s.b.byteLength - 1) << 2) | 2);
  } else {
    const lengthSize = getByteSizeOfInteger(s.b.byteLength);
    writeElementHead(ctx, 3, (lengthSize << 2) | 0);
    writeIntegerBody(ctx, lengthSize, lengthSize);
  }
  writeStringBody(ctx, s);
}

export function writeObject(ctx: Context, v: Record<string, unknown>, useDoubleFloatPrecision: boolean, loopWriteFn: (ctx: Context, v: unknown, useDoubleFloatPrecision: boolean) => void): void {
  const props = Object.keys(v);
  const len = props.length;
  const size = getByteSizeOfInteger(len);
  if (size >= 4) throw new Error('too huge object.');

  const tag = len <= 7 ? (
    (len << 1) | 1
  ) : (
    ((size - 1) << 1) | 0
  );
  writeElementHead(ctx, 5, tag);
  props.forEach(prop => {
    writeString(ctx, prop);
    const pv = v[prop];
    loopWriteFn(ctx, pv, useDoubleFloatPrecision);
  });
}

export function writeArray(ctx: Context, v: unknown[], useDoubleFloatPrecision: boolean, loopWriteFn: (ctx: Context, v: unknown, useDoubleFloatPrecision: boolean) => void): void {
  const len = v.length;
  if (len === 0) {
    return writeElementHead(ctx, 4, 1);
  }
  const isMicro = len <= 3;
  const isSame = isArrayItemsSame(v);
  const size = getByteSizeOfInteger(len);
  const tag = ((isSame ? 1 : 0) << 3) | (
    isMicro ? (len << 1) : ((size - 1) << 1)
  ) | (isMicro ? 1 : 0);
  writeElementHead(ctx, 4, tag);
  if (!isMicro) {
    writeIntegerBody(ctx, len, size);
  }
  if (!isSame) {
    v.forEach(item => {
      loopWriteFn(ctx, item, useDoubleFloatPrecision);
    });
    return;
  }
  loopWriteFn(ctx, v[0], useDoubleFloatPrecision);
  const firstType = getType(v[0]);
  if (firstType !== 'object') {
    /**
     * 数组的所有项目有相同的类型（不包括 object 和 array）和值。
     * 因此，只要存储数组的第一个项目就够了，后面的都可以忽略。通过第一个项目和数组的长度，就可以还原数组。
     */
    return;
  }
  /**
   * 数组的所有项目都是有【完全一致】的属性的 object，因此，第一个项目需要存储属性，
   * 以后的项目都可以直接按属性排序后的顺序存储属性值。【完全一致】的概念参看 isArrayItemsSame 函数注释。
   * 
   * 这个策略用于高度压缩诸如 [{x: 10, y: 20}, {x: 30, y: 40}] 这样的点阵数组。
   */
  const props = Object.keys(v[0]).sort();
  v.forEach((item, i) => {
    if (i === 0) return;
    props.forEach(prop => {
      loopWriteFn(ctx, (item as Record<string, unknown>)[prop], useDoubleFloatPrecision);
    });
  });
}

export function loopWrite(ctx: Context, v: unknown, useDoubleFloatPrecision: boolean): void {
  const type = typeof v;
  switch(type) {
    case 'undefined':
      writeMicro(ctx, 1, 0);
      break;
    case 'boolean':
      writeMicro(ctx, 0, v ? 1 : 0);
      break;
    case 'string':
      writeString(ctx, v as string);
      break;
    case 'bigint':
      writeInteger(ctx, v as bigint);
      break;
    case 'number':
      if (Number.isNaN(v as number) || !Number.isFinite(v as number)) {
        throw new Error('do not support NaN or Infinity');
      }
      if (Number.isInteger(v as number)) {
        if (!Number.isSafeInteger(v as number)) {
          throw new Error('integer is not safe, use bigint instead.');
        }
        writeInteger(ctx, v as number);
      } else {
        writeFloat(ctx, v as number, useDoubleFloatPrecision);
      }
      break;
    case 'object':
      if (v === null) {
        writeMicro(ctx, 1, 1);
      } else if (Array.isArray(v)) {
        writeArray(ctx, v, useDoubleFloatPrecision, loopWrite);
      } else {
        writeObject(ctx, v as Record<string, unknown>, useDoubleFloatPrecision, loopWrite);
      }
      break;
    default:
      throw new Error('unsupport value type:' + type);
  }
}