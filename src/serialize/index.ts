import {
  Context
} from './helper';
import {
  prepareDictionary
} from './dictionary';
import {
  loopWrite
} from './writer';

export function serialize(data: JSON): ArrayBuffer {
  const globalContext = new Context();
  prepareDictionary(globalContext, data);
  loopWrite(globalContext, data);
  return globalContext.view.buffer.slice(0, globalContext.offset);
}