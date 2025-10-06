import { EventEmitter } from 'events';
import { type Alert } from './types';

// Extend EventEmitter to have typed events
interface TypedEventEmitter {
  on(event: 'log', listener: (log: string) => void): this;
  on(event: 'alert', listener: (alert: Alert) => void): this;
  off(event: 'log', listener: (log: string) => void): this;
  off(event: 'alert', listener: (alert: Alert) => void): this;
  emit(event: 'log', log: string): boolean;
  emit(event: 'alert', alert: Alert): boolean;
  listenerCount(event: 'log' | 'alert'): number;
}

class TypedEventEmitter extends EventEmitter {}

// Create a singleton instance of the event emitter
// This allows different parts of the server-side application to communicate
// without direct dependencies, perfect for decoupling the log and alert streams.
export const logEmitter = new TypedEventEmitter();
