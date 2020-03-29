
export class Context {
  /**
   * global string dictionary
   */
  d: string[];
  /**
   * current data-view
   */
  v: DataView;
  /**
   * offset of current data-view
   */
  o: number;

  constructor(buffer: ArrayBuffer) {
    this.d = null;
    this.v = new DataView(buffer);
    this.o = 0;
  }
}

export function decodeString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}
