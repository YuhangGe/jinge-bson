import {
  Context
} from './helper';
import {
  prepareDictionary
} from './dictionary';
import {
  loopWrite
} from './writer';

export function serialize(data: unknown, useDoubleFloatPrecision: boolean = false): ArrayBuffer {
  const globalContext = new Context();
  prepareDictionary(globalContext, data);
  loopWrite(globalContext, data, useDoubleFloatPrecision);
  return globalContext.v.buffer.slice(0, globalContext.o);
}