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

export const BUFFER_PAGE_SIZE = 1024;

export class Context {
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

  constructor() {
    this.d = null;
    this.v = new DataView(new ArrayBuffer(BUFFER_PAGE_SIZE));
    this.o = 0;
  }
}

function transferArrayBuffer(source: ArrayBuffer, length: number): ArrayBuffer {
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
  length = ((length / BUFFER_PAGE_SIZE | 0) + 1) * BUFFER_PAGE_SIZE;
  ctx.v = new DataView(transferArrayBuffer(ctx.v.buffer, length));
}

export function getByteSizeOfInteger(v: number | bigint): number {
  if (v > 0xffffffff) return 8;
  else if (v > 0x00ffffff) return 4;
  else if (v > 0x0000ffff) return 3;
  else if (v > 0x000000ff) return 2;
  else return 1;
}
