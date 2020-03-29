import {
  serialize as bsonSerialize, SerializeOptions
} from '../../src/serialize/index';

export type SerializeTestResult = {
  dict: string[];
  elType: number;
  elTag: number;
  elBody: DataView;
  buffer: ArrayBuffer;
}


export const readIntegerFns = [
  (v: DataView, o: number): number => v.getUint8(o),
  (v: DataView, o: number): number  => v.getUint16(o, false),
  (v: DataView, o: number): number  => (v.getUint8(o) << 16) | v.getUint16(o + 1, false),
  (v: DataView, o: number): number  => v.getUint32(o, false)
];


function parseDictionary(view: DataView, dict: string[]): number {
  let offset = 0;
  const tag = view.getUint8(offset++) & 0x0f;
  const isMicro = (tag & 0b0001) === 1;
  let len: number;
  if (isMicro) {
    len = ((tag & 0b1110) >> 1) + 1;
  } else {
    const size = ((tag & 0b0110) >> 1) + 1;
    len = readIntegerFns[size - 1](view, offset);
    offset += size;
  }
  for(let i = 0; i < len; i++) {
    let size = view.getUint8(offset++);
    if ((size & 0b10000000) > 0) {
      size = ((size & 0b01111111) << 8) | view.getUint8(offset++);
    } else {
      size = size & 0b01111111;
    }
    dict.push(new TextDecoder().decode(view.buffer.slice(offset, offset + size)));
    offset += size;
  }
  return offset;
}

export function serialize(v: unknown, options: SerializeOptions): SerializeTestResult {
  const result = bsonSerialize(v, options);
  if (!result || result.byteLength === 0) {
    throw new Error('bad result');
  }
  const dict = [];
  let view = new DataView(result);
  let head = view.getUint8(0);
  let offset = 0;
  if (((head & 0xf0) >> 4) === 6) {
    offset = parseDictionary(view, dict);
  }
  if (offset > 0) {
    view = new DataView(result.slice(offset));
    head = view.getUint8(0);
  }
  return {
    dict,
    elType: (head & 0xf0) >> 4,
    elTag: (head & 0x0f),
    elBody: new DataView(result.slice(offset + 1)),
    buffer: result
  };
}

export function isArrayBufferEqual(src: ArrayBuffer, dst: ArrayBuffer): boolean {
  if (src.byteLength !== dst.byteLength) {
    return false;
  }
  if (src.byteLength === 0 && dst.byteLength === 0) {
    return true;
  }
  const s = new Uint8Array(src);
  const d = new Uint8Array(dst);
  for(let i = 0; i < src.byteLength; i++) {
    if (s[i] !== d[i]) return false;
  }
  return true;
}