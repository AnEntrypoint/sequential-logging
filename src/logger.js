import { LOG_LEVELS, LEVEL_NAMES } from './levels.js';
import { nowISO } from 'sequential-utils/timestamps';

class Logger {
  constructor() {
    this.level = LOG_LEVELS.INFO;
    this.context = {};
    this.outputFormat = 'cli';
    this.timestamp = true;
  }

  setLevel(level) {
    if (typeof level === 'string') {
      const numLevel = LOG_LEVELS[level.toUpperCase()];
      if (numLevel === undefined) {
        throw new Error(`Invalid log level: ${level}. Must be one of: DEBUG, INFO, WARN, ERROR`);
      }
      this.level = numLevel;
    } else if (typeof level === 'number') {
      if (level < 0 || level > 3) {
        throw new Error(`Invalid log level: ${level}. Must be 0-3 (DEBUG-ERROR)`);
      }
      this.level = level;
    } else {
      throw new Error(`Invalid log level type: ${typeof level}`);
    }
  }

  setContext(context) {
    this.context = context || {};
  }

  addContext(key, value) {
    this.context[key] = value;
  }

  setOutputFormat(format) {
    if (!['cli', 'server', 'json'].includes(format)) {
      throw new Error(`Invalid output format: ${format}. Must be one of: cli, server, json`);
    }
    this.outputFormat = format;
  }

  setTimestamp(enabled) {
    this.timestamp = enabled;
  }

  #shouldLog(level) {
    return level >= this.level;
  }

  #formatMessage(levelName, msg, data, timestamp) {
    const ts = timestamp ? `[${nowISO()}] ` : '';

    if (this.outputFormat === 'json') {
      const entry = {
        level: levelName,
        message: msg,
        ...this.context
      };
      if (data) {
        entry.data = data;
      }
      if (timestamp) {
        entry.timestamp = nowISO();
      }
      return JSON.stringify(entry);
    }

    if (this.outputFormat === 'server') {
      const contextStr = Object.keys(this.context).length > 0
        ? ` ${JSON.stringify(this.context)}`
        : '';
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      return `${ts}[${levelName}]${contextStr} ${msg}${dataStr}`;
    }

    const contextStr = Object.keys(this.context).length > 0
      ? `[${Object.entries(this.context).map(([k, v]) => `${k}=${v}`).join(' ')}] `
      : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${ts}${contextStr}${msg}${dataStr}`;
  }

  #write(stream, formatted) {
    stream.write(formatted + '\n');
  }

  debug(msg, dataOrFn) {
    if (!this.#shouldLog(LOG_LEVELS.DEBUG)) {
      return;
    }

    const data = typeof dataOrFn === 'function' ? dataOrFn() : dataOrFn;
    const formatted = this.#formatMessage('DEBUG', msg, data, this.timestamp);
    this.#write(process.stdout, formatted);
  }

  info(msg, dataOrFn) {
    if (!this.#shouldLog(LOG_LEVELS.INFO)) {
      return;
    }

    const data = typeof dataOrFn === 'function' ? dataOrFn() : dataOrFn;
    const formatted = this.#formatMessage('INFO', msg, data, this.timestamp);
    this.#write(process.stdout, formatted);
  }

  warn(msg, dataOrFn) {
    if (!this.#shouldLog(LOG_LEVELS.WARN)) {
      return;
    }

    const data = typeof dataOrFn === 'function' ? dataOrFn() : dataOrFn;
    const formatted = this.#formatMessage('WARN', msg, data, this.timestamp);
    this.#write(process.stderr, formatted);
  }

  error(msg, err, dataOrFn) {
    if (!this.#shouldLog(LOG_LEVELS.ERROR)) {
      return;
    }

    let data = err;
    let errorObj = null;

    if (err instanceof Error) {
      errorObj = {
        name: err.name,
        message: err.message,
        stack: err.stack
      };
      data = typeof dataOrFn === 'function' ? dataOrFn() : dataOrFn;
    } else if (typeof err === 'function') {
      data = err();
      errorObj = null;
    } else {
      data = err;
      errorObj = null;
    }

    const mergedData = errorObj
      ? { ...data, error: errorObj }
      : data;

    const formatted = this.#formatMessage('ERROR', msg, mergedData, this.timestamp);
    this.#write(process.stderr, formatted);
  }

  child(context) {
    const childLogger = new Logger();
    childLogger.level = this.level;
    childLogger.context = { ...this.context, ...context };
    childLogger.outputFormat = this.outputFormat;
    childLogger.timestamp = this.timestamp;
    return childLogger;
  }
}

export default Logger;
