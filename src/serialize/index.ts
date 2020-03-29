import {
  Context
} from './helper';
import {
  prepareDictionary
} from './dictionary';
import {
  loopWrite
} from './writer';

export type SerializeOptions = {
  bufferPageSize?: number;
  floatPrecision?: 'single' | 'double';
};

export function serialize(data: unknown, {
  bufferPageSize = 1024,
  floatPrecision = 'single'
}: SerializeOptions = {
  bufferPageSize: 1024,
  floatPrecision: 'single'
}): ArrayBuffer {
  const globalContext = new Context(bufferPageSize);
  prepareDictionary(globalContext, data);
  loopWrite(globalContext, data, floatPrecision === 'double');
  return globalContext.v.buffer.slice(0, globalContext.o);
}