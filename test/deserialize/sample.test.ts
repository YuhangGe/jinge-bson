import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import {
  serialize, deserialize
} from '../../src';

function percent(a: number, b: number): string {
  return (Math.round(a / b * 10000) / 100).toFixed(2) + '%'; 
}

function testSample(name: string): void {
  const gzipBuf = fs.readFileSync(
    path.join(__dirname, `sample/${name}.json.gz`)
  );
  const buf = zlib.gunzipSync(gzipBuf);
  const json = JSON.parse(buf.toString('utf-8'));
  // console.log(json);
  let startTime = Date.now();
  const bson = serialize(json, {
    floatPrecision: 'double'
  });
  const serializeTime = Date.now() - startTime;
  startTime = Date.now();
  const result = deserialize(bson);
  const deserailizeTime = Date.now() - startTime;
  startTime = Date.now();
  const gzipedBson = zlib.gzipSync(bson, {
    level: 9
  });
  startTime = Date.now();
  expect(json).toStrictEqual(result);
  // eslint-disable-next-line no-console
  console.log(
    name + '\n-----\n' +
    `Cost time:\n\tseriailize: ${serializeTime}ms\n\tdeserialize: ${deserailizeTime}ms,\n\tjest-expect: ${Date.now() - startTime}ms\n` +
    `Byte size:\n\torigin: ${buf.length}\n\tgziped: ${gzipBuf.length}\n\tbson: ${bson.byteLength}\n\tgziped-bson: ${gzipedBson.length}\n` +
    `Compress ratio:\n\tgziped/origin: ${percent(gzipBuf.length, buf.length)}\n\tbson/origin: ${percent(bson.byteLength, buf.length)}\n\tgziped-bson/origin: ${percent(gzipedBson.length, buf.length)}\n`
  );
}

describe('deserialize sample json', () => {
  test('data.hawaii.gov', () => {
    testSample('data.hawaii.gov');
  });

  test('citylots', () => {
    testSample('citylots');
  });

});