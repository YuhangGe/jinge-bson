import { Context, decodeString } from './helper';

export const readIntegerFns = [
  (v: DataView, o: number): number => v.getUint8(o),
  (v: DataView, o: number): number  => v.getUint16(o, false),
  (v: DataView, o: number): number  => (v.getUint8(o) << 16) | v.getUint16(o + 1, false),
  (v: DataView, o: number): number  => v.getUint32(o, false)
];

export function parseDictionary(ctx: Context, tag: number): void {
  const isMicro = (tag & 0b0001) === 1;
  let len: number;
  if (isMicro) {
    len = ((tag & 0b1110) >> 1) + 1;
  } else {
    const size = ((tag & 0b0110) >> 1) + 1;
    len = readIntegerFns[size - 1](ctx.v, ctx.o);
    ctx.o += size;
  }
  for(let i = 0; i < len; i++) {
    let size = ctx.v.getUint8(ctx.o++);
    if ((size & 0b10000000) > 0) {
      size = ((size & 0b01111111) << 8) | ctx.v.getUint8(ctx.o++);
    } else {
      size = size & 0b01111111;
    }
    if (!ctx.d) ctx.d = [];
    ctx.d.push(new TextDecoder().decode(ctx.v.buffer.slice(ctx.o, ctx.o + size)));
    ctx.o += size;
  }
}

export function parseMicro(ctx: Context, tag: number): number | boolean | null | undefined {
  const type = tag & 0b0011;
  const value = (tag & 0b1100) >> 2;
  switch(type) {
    case 0:
      return value > 0;
    case 1:
      return value === 1 ? null : undefined;
    case 2:
      return value;
    default:
      return -value;
  }
}

export function parseInteger(ctx: Context, tag: number): number | bigint {
  const size = (tag & 0b1110) >> 1;
  const negative = tag & 0b0001;
  let n: number | bigint;
  if (size <= 3) {
    n = readIntegerFns[size](ctx.v, ctx.o);
    ctx.o += size + 1;
  } else if (size === 7) {
    n = ctx.v.getBigUint64(ctx.o);
    ctx.o += 8;
    if (n <= Number.MAX_SAFE_INTEGER) {
      n = Number(n);
    }
  } else {
    throw new Error('unsupport integer size: ' + size);
  }
  return negative > 0 ? (-n) : n;
}

export function parseFloat(ctx: Context, tag: number): number {
  const isDouble = (tag & 0b0001) > 0;
  const n = isDouble ? ctx.v.getFloat64(ctx.o, false) : ctx.v.getFloat32(ctx.o, false);
  ctx.o += isDouble ? 8 : 4;
  return n;
}

export function parseString(ctx: Context, tag: number): string {
  const type = tag & 0b0011;
  const size = (tag & 0b1100) >> 2;
  if (type === 3) {
    return '';
  }
  let str: string;
  if (type === 2) {
    str = decodeString(ctx.v.buffer.slice(ctx.o, ctx.o + size + 1));
    ctx.o += size + 1;
  } else {
    const lenOrIndex = readIntegerFns[size](ctx.v, ctx.o);
    ctx.o += size + 1;
    if (type === 1) {
      if (!ctx.d || lenOrIndex >= ctx.d.length) {
        throw new Error('string index overflow');
      }
      str = ctx.d[lenOrIndex];
    } else {
      str = decodeString(ctx.v.buffer.slice(ctx.o, ctx.o + lenOrIndex));
      ctx.o += lenOrIndex;
    }
  }
  return str;
}

export function parseArray(ctx: Context, tag: number, loopParseFn: (ctx: Context) => unknown): unknown[] {
  const isMicro = (tag & 0b0001) > 0;
  const isSame = ((tag & 0b1000) >> 3) > 0;
  const size = (tag & 0b0110) >> 1;
  if (isMicro && size === 0) {
    return [];
  }
  let len = size;
  if (!isMicro) {
    len = readIntegerFns[size](ctx.v, ctx.o);
    ctx.o += size + 1;
  }
  if (!isSame) {
    const result = [];
    for(let i = 0; i < len; i++) {
      result.push(loopParseFn(ctx));
    }
    return result;
  }
  const firstItem = loopParseFn(ctx);
  if (len === 1) {
    return [firstItem];
  }
  if (typeof firstItem === 'object' && firstItem !== null) {
    const props = Object.keys(firstItem).sort();
    const result = [firstItem];
    for(let i = 1; i < len; i++) {
      const item: Record<string, unknown> = {};
      props.forEach(prop => {
        const v = loopParseFn(ctx);
        item[prop as string] = v;
      });
      result.push(item);
    }
    return result;
  } else {
    return new Array(len).fill(firstItem);
  }
}

export function parseObject(ctx: Context, tag: number, loopParseFn: (ctx: Context) => unknown): Record<string, unknown> {
  const isMicro = (tag & 0b0001) > 0;
  let propSize: number;
  if (isMicro) {
    propSize = (tag & 0b1110) >> 1;
    if (propSize === 0) {
      return {};
    }
  } else {
    const size = (tag & 0b0110) >> 1;
    propSize = readIntegerFns[size](ctx.v, ctx.o);
    ctx.o += size + 1;
  }
  const result: Record<string, unknown> = {};
  for(let i = 0; i < propSize; i++) {
    const propName = loopParseFn(ctx);
    const propValue = loopParseFn(ctx);
    result[propName as string] = propValue;
  }
  return result;
}

export function loopParse(ctx: Context): unknown {
  const head = ctx.v.getUint8(ctx.o++);
  const type = (head & 0xf0) >> 4;
  const tag = head & 0x0f;
  switch(type) {
    case 0:
      return parseMicro(ctx, tag);
    case 1:
      return parseInteger(ctx, tag);
    case 2:
      return parseFloat(ctx, tag);
    case 3:
      return parseString(ctx, tag);
    case 4:
      return parseArray(ctx, tag, loopParse);
    case 5:
      return parseObject(ctx, tag, loopParse);
    default:
      throw new Error('unsupport type: ' + type);
  }
}