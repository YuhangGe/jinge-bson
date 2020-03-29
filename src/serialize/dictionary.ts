import {
  Context, getByteSizeOfInteger
} from './helper';
import {
  writeIntegerBody, writeElementHead,
  writeUint8, writeUint16, writeStringBody
} from './writer';

export function prepareDictionary(ctx: Context, data: unknown): void {
  function add(s: string): void {
    let map = ctx.d;
    if (!map) {
      map = ctx.d = new Map();
    }
    let v = map.get(s);
    if (!v) {
      const arr = (new TextEncoder()).encode(s);
      if (arr.length > 32767) {
        // 当前版本的字符串，不能超过 32767 长度。
        throw new Error('Do not support string byteLength greater than 32767');
      }
      v = {
        b: arr,
        c: 1,
        i: -1
      };
      map.set(s, v);
    } else if (v.c > 0) {
      v.c++;
    }
  }
  function loop(v: unknown): void {
    const type = typeof v;
    if (type === 'string') {
      if ((v as string).length > 0) {
        // 只有长度大于 0 的字符串，才需要加入字典表。
        add(v as string);
      }
      return;
    }
    if (type !== 'object' || type === null) {
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(cv => loop(cv));
    } else {
      Object.keys(v).forEach(prop => {
        if (prop.length > 0) {
          add(prop);
        }
        loop((v as Record<string, unknown>)[prop]);
      });
    }
  }
  loop(data);
  if (!ctx.d) {
    return;
  }

  const entries = [...ctx.d.values()].filter(entry => {
    // 只有 bytes 长度大于 1，且出现次数超过 1 次的字符串才有放到字典表里的意义，
    // 否则放到全局字典表里反而会占用额外大小。
    return entry.b.byteLength > 1 && entry.c > 1;
  }).sort((a, b) => {
    // 按出现频率的倒序排列，这样在字典里的索引大小最小。
    return a.c === b.c ? 0 : (
      a.c > b.c ? -1 : 1
    );
  });
  if (entries.length === 0) {
    return;
  }
  const isMicro = entries.length <= 4 ? 1 : 0;
  const size = getByteSizeOfInteger(entries.length);
  if (size > 4) {
    throw new Error('too huge dictionary.');
  }
  const tag = isMicro ? (
    ((entries.length - 1) << 1) | 1
  ) : (
    ((size - 1) << 1) | 0    
  );
  writeElementHead(ctx, 6, tag);
  if (!isMicro) {
    writeIntegerBody(ctx, entries.length, size);
  }
  entries.forEach((entry, idx) => {
    entry.i = idx;
    const bLen = entry.b.byteLength;
    if (bLen > 127) {
      writeUint16(ctx, (1 << 15) | bLen);
    } else {
      writeUint8(ctx, (1 << 7) | bLen);
    }
    writeStringBody(ctx, entry);
  });
}
