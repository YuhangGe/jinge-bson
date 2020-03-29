export type Dict = {
  /**
   * array-buffer of TextEncoder.encode
   */
  b: ArrayBuffer;
  /**
   * count of string
   */
  c: number;
  /**
   * index of string
   */
  i: number;
};

export class Context {
  /**
   * buffer page size
   */
  p: number;
  /**
   * global string dictionary
   */
  d: Map<string, Dict>;
  /**
   * current data-view
   */
  v: DataView;
  /**
   * offset of current data-view
   */
  o: number;

  constructor(bufferPageSize: number) {
    this.p = bufferPageSize;
    this.d = null;
    this.v = new DataView(new ArrayBuffer(bufferPageSize));
    this.o = 0;
  }
}

declare global {
  interface ArrayBufferConstructor {
    transfer: (source: ArrayBuffer, length: number) => ArrayBuffer;
  }
}

export function transferArrayBuffer(source: ArrayBuffer, length: number): ArrayBuffer {
  if (ArrayBuffer.transfer) {
    return ArrayBuffer.transfer(source, length);
  }
  if (length <= source.byteLength) {
    return source.slice(0, length);
  }
  const sourceView = new Uint8Array(source);
  const destView = new Uint8Array(new ArrayBuffer(length));
  destView.set(sourceView);
  return destView.buffer;
}

export function prepareArrayBuffer(ctx: Context, size: number): void {
  let length = ctx.o + size;
  if (length <= ctx.v.byteLength) {
    return;
  }
  length = ((length / ctx.p | 0) + 1) * ctx.p;
  ctx.v = new DataView(transferArrayBuffer(ctx.v.buffer, length));
}

export function getByteSizeOfInteger(v: number | bigint): number {
  if (v > 0xffffffff) return 8;
  else if (v > 0x00ffffff) return 4;
  else if (v > 0x0000ffff) return 3;
  else if (v > 0x000000ff) return 2;
  else return 1;
}

export function getType(v: unknown): string {
  const type = typeof v;
  if (type === 'object') {
    if (v === null) return 'null';
    else if (v instanceof Boolean) return 'BOOL';
    else if (Array.isArray(v)) return 'array';
  } else if (type === 'number') {
    return Number.isInteger(v as number) ? 'integer' : 'float';
  }
  return type;
}

/**
 * 判断数组里的项目是否全部相同。“相同”的定义如下：
 * 1. 项目的类型全都不是 object（但可以是 null） 或 array，且项目的【类型】和【值】全都相同。或者，
 * 2. 项目的值的类型全部是 object，且所有对象的 properties 完全一致，
 *    且相同名称的 property 的值有相同的类型且类型不是 object（但可以是 null） 或 array。
 * 
 * @param v Array
 */
export function isArrayItemsSame(v: unknown[]): boolean {
  if (v.length <= 1) {
    return true;
  }
  let firstType: string;
  let firstObjSchema: Map<string, string>;
  return v.every((item, i) => {
    if (i === 0) {
      firstType = getType(item);
      if (firstType === 'array') {
        return false;
      } else if (firstType === 'object') {
        firstObjSchema = new Map();
        return Object.keys(item).every(prop => {
          const propType = getType((item as Record<string, unknown>)[prop]);
          firstObjSchema.set(prop, propType);
          return propType !== 'object' && propType !== 'array';
        });
      }
      return true;
    }
    const type = getType(item);
    if (type !== firstType) {
      return false;
    }
    if (type !== 'object') {
      return type === 'BOOL' ? item.valueOf() === v[0].valueOf() :  item === v[0];
    }
    return Object.keys(item).every(prop => {
      return firstObjSchema.get(prop) === getType((item as Record<string, unknown>)[prop]);
    });
  });
}