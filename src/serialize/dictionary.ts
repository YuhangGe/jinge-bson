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
      v = {
        b: arr,
        /**
         * 如果 byteLength = 1，则不需要写如字典表，否则反而多占用一个 byte 的空间。
         * 如果 byteLength > 32767(即 15bits)，也不放入字典表，字典表使用的是更节省空间的方式存的字符串。
         */
        c: arr.length > 1 && arr.length <= 32767 ? 1 : 0,
        i: -1
      };
      map.set(s, v);
    } else if (v.c > 0) {
      // 只有 byteLength 在 (1 ~ 32767] 之间的字符串，才递增其出现的总次数。
      // 总次数用于接下来的过滤逻辑，只有总次数 >= 2 的字符串才有必要存在字典表里。
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
    if (type !== 'object' || v === null) {
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
    // 只有 byteLength 长度大于 1 且小于等于 32767，且出现次数超过 1 次的字符串才有放到字典表里。
    return entry.c > 1;
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
  // if (size > 4) {
  //   似乎没有必要进行 assert，超过 40 亿的字典不大可能在现实情况里出现。
  //   throw new Error('too huge dictionary');
  // }
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
      writeUint8(ctx, (0 << 7) | bLen);
    }
    writeStringBody(ctx, entry);
  });
}
