import { serialize, deserialize, SerializeOptions } from '../../src';

export function serializeThenDeserializeThenAssertEqual(v: unknown, options?: SerializeOptions): void {
  const bson = serialize(v, options);
  const json = deserialize(bson);
  expect(json).toStrictEqual(v);
}