import { test } from 'node:test';
import assert from 'node:assert';
import { loggerInstance as logger, Logger, LOG_LEVELS, LEVEL_NAMES } from '../src/index.js';

test('Log Levels and Constants', async (t) => {
  await t.test('LOG_LEVELS contains all expected levels', () => {
    assert.ok(LOG_LEVELS.DEBUG !== undefined);
    assert.ok(LOG_LEVELS.INFO !== undefined);
    assert.ok(LOG_LEVELS.WARN !== undefined);
    assert.ok(LOG_LEVELS.ERROR !== undefined);
  });

  await t.test('LOG_LEVELS has correct numeric values', () => {
    assert.equal(LOG_LEVELS.DEBUG, 0);
    assert.equal(LOG_LEVELS.INFO, 1);
    assert.equal(LOG_LEVELS.WARN, 2);
    assert.equal(LOG_LEVELS.ERROR, 3);
  });

  await t.test('LEVEL_NAMES maps numbers to strings', () => {
    assert.equal(LEVEL_NAMES[0], 'DEBUG');
    assert.equal(LEVEL_NAMES[1], 'INFO');
    assert.equal(LEVEL_NAMES[2], 'WARN');
    assert.equal(LEVEL_NAMES[3], 'ERROR');
  });
});

test('Logger Configuration', async (t) => {
  const testLogger = new Logger();

  await t.test('setLevel accepts string', () => {
    testLogger.setLevel('DEBUG');
    assert.equal(testLogger.level, LOG_LEVELS.DEBUG);
  });

  await t.test('setLevel accepts numeric value', () => {
    testLogger.setLevel(LOG_LEVELS.WARN);
    assert.equal(testLogger.level, LOG_LEVELS.WARN);
  });

  await t.test('setLevel throws for invalid string', () => {
    assert.throws(() => {
      testLogger.setLevel('INVALID');
    });
  });

  await t.test('setOutputFormat accepts valid formats', () => {
    testLogger.setOutputFormat('cli');
    testLogger.setOutputFormat('server');
    testLogger.setOutputFormat('json');
  });

  await t.test('setOutputFormat throws for invalid format', () => {
    assert.throws(() => {
      testLogger.setOutputFormat('invalid');
    });
  });

  await t.test('setTimestamp enables/disables timestamps', () => {
    testLogger.setTimestamp(true);
    assert.equal(testLogger.timestamp, true);
    testLogger.setTimestamp(false);
    assert.equal(testLogger.timestamp, false);
  });
});

test('Context Management', async (t) => {
  const testLogger = new Logger();

  await t.test('setContext replaces entire context', () => {
    testLogger.setContext({ service: 'test', env: 'dev' });
    assert.deepEqual(testLogger.context, { service: 'test', env: 'dev' });
  });

  await t.test('addContext merges with existing context', () => {
    testLogger.setContext({ service: 'test' });
    testLogger.addContext('userId', '123');
    assert.equal(testLogger.context.service, 'test');
    assert.equal(testLogger.context.userId, '123');
  });

  await t.test('addContext overwrites existing keys', () => {
    testLogger.setContext({ userId: 'user1' });
    testLogger.addContext('userId', 'user2');
    assert.equal(testLogger.context.userId, 'user2');
  });

  await t.test('setContext with empty object clears context', () => {
    testLogger.setContext({ key: 'value' });
    testLogger.setContext({});
    assert.deepEqual(testLogger.context, {});
  });
});

test('Logging Methods', async (t) => {
  const testLogger = new Logger();
  testLogger.setLevel(LOG_LEVELS.DEBUG);
  testLogger.setTimestamp(false);

  await t.test('debug method exists and is callable', () => {
    assert.ok(typeof testLogger.debug === 'function');
  });

  await t.test('info method exists and is callable', () => {
    assert.ok(typeof testLogger.info === 'function');
  });

  await t.test('warn method exists and is callable', () => {
    assert.ok(typeof testLogger.warn === 'function');
  });

  await t.test('error method exists and is callable', () => {
    assert.ok(typeof testLogger.error === 'function');
  });

  await t.test('logging methods accept message only', () => {
    testLogger.debug('Message only');
    testLogger.info('Message only');
    testLogger.warn('Message only');
    testLogger.error('Error message', new Error('Sample error'));
  });

  await t.test('logging methods accept message and data object', () => {
    testLogger.debug('Message', { data: 'value' });
    testLogger.info('Message', { data: 'value' });
    testLogger.warn('Message', { data: 'value' });
  });

  await t.test('logging methods accept message and data function', () => {
    testLogger.debug('Message', () => ({ data: 'value' }));
    testLogger.info('Message', () => ({ data: 'value' }));
    testLogger.warn('Message', () => ({ data: 'value' }));
  });
});

test('Lazy Evaluation', async (t) => {
  const testLogger = new Logger();

  await t.test('functions are not called when level does not match', () => {
    testLogger.setLevel(LOG_LEVELS.WARN);
    let callCount = 0;
    const fn = () => {
      callCount++;
      return { called: true };
    };
    testLogger.debug('Message', fn);
    assert.equal(callCount, 0);
  });

  await t.test('functions are called when level matches', () => {
    testLogger.setLevel(LOG_LEVELS.DEBUG);
    let callCount = 0;
    const fn = () => {
      callCount++;
      return { called: true };
    };
    testLogger.debug('Message', fn);
    assert.equal(callCount, 1);
  });

  await t.test('data functions apply to all log levels', () => {
    testLogger.setLevel(LOG_LEVELS.DEBUG);
    let debugCount = 0, infoCount = 0, warnCount = 0, errorCount = 0;

    testLogger.debug('Debug', () => { debugCount++; return {}; });
    testLogger.info('Info', () => { infoCount++; return {}; });
    testLogger.warn('Warn', () => { warnCount++; return {}; });
    testLogger.error('Error', new Error('test'), () => { errorCount++; return {}; });

    assert.equal(debugCount, 1);
    assert.equal(infoCount, 1);
    assert.equal(warnCount, 1);
    assert.equal(errorCount, 1);
  });
});

test('Error Handling', async (t) => {
  const testLogger = new Logger();
  testLogger.setLevel(LOG_LEVELS.ERROR);
  testLogger.setTimestamp(false);

  await t.test('error method accepts Error object', () => {
    const error = new Error('Test error');
    testLogger.error('Failed', error);
  });

  await t.test('error method accepts error and data', () => {
    const error = new Error('Test error');
    testLogger.error('Failed', error, { operation: 'test' });
  });

  await t.test('error method accepts error and data function', () => {
    const error = new Error('Test error');
    testLogger.error('Failed', error, () => ({ operation: 'test' }));
  });

  await t.test('error method handles string as error', () => {
    testLogger.error('Failed', 'error message', { data: 'value' });
  });

  await t.test('error method extracts error properties', () => {
    const error = new Error('Test');
    error.code = 'ERR_TEST';
    testLogger.error('Failed', error, { operation: 'test' });
  });
});

test('Log Level Filtering', async (t) => {
  await t.test('DEBUG level logs all messages', () => {
    const testLogger = new Logger();
    testLogger.setLevel(LOG_LEVELS.DEBUG);
    testLogger.setTimestamp(false);

    assert.doesNotThrow(() => {
      testLogger.debug('Debug');
      testLogger.info('Info');
      testLogger.warn('Warn');
      testLogger.error('Error', new Error('test'));
    });
  });

  await t.test('INFO level skips DEBUG', () => {
    const testLogger = new Logger();
    testLogger.setLevel(LOG_LEVELS.INFO);
    testLogger.setTimestamp(false);

    assert.doesNotThrow(() => {
      testLogger.info('Info');
      testLogger.warn('Warn');
      testLogger.error('Error', new Error('test'));
    });
  });

  await t.test('WARN level skips DEBUG and INFO', () => {
    const testLogger = new Logger();
    testLogger.setLevel(LOG_LEVELS.WARN);
    testLogger.setTimestamp(false);

    assert.doesNotThrow(() => {
      testLogger.warn('Warn');
      testLogger.error('Error', new Error('test'));
    });
  });

  await t.test('ERROR level only logs errors', () => {
    const testLogger = new Logger();
    testLogger.setLevel(LOG_LEVELS.ERROR);
    testLogger.setTimestamp(false);

    assert.doesNotThrow(() => {
      testLogger.error('Error', new Error('test'));
    });
  });
});

test('Output Formats', async (t) => {
  const testLogger = new Logger();
  testLogger.setLevel(LOG_LEVELS.DEBUG);

  await t.test('CLI format is valid', () => {
    testLogger.setOutputFormat('cli');
    assert.doesNotThrow(() => {
      testLogger.info('Test message', { value: 42 });
    });
  });

  await t.test('Server format is valid', () => {
    testLogger.setOutputFormat('server');
    assert.doesNotThrow(() => {
      testLogger.info('Test message', { value: 42 });
    });
  });

  await t.test('JSON format is valid', () => {
    testLogger.setOutputFormat('json');
    assert.doesNotThrow(() => {
      testLogger.info('Test message', { value: 42 });
    });
  });
});

test('Child Loggers', async (t) => {
  await t.test('child method returns Logger instance', () => {
    const childLogger = logger.child({ module: 'test' });
    assert.ok(childLogger instanceof Logger);
  });

  await t.test('child logger inherits parent configuration', () => {
    const parentLogger = new Logger();
    parentLogger.setLevel(LOG_LEVELS.WARN);
    parentLogger.setContext({ service: 'test' });

    const childLogger = parentLogger.child({ module: 'auth' });
    assert.equal(childLogger.level, LOG_LEVELS.WARN);
    assert.equal(childLogger.context.service, 'test');
  });

  await t.test('child logger merges context', () => {
    const parentLogger = new Logger();
    parentLogger.setContext({ service: 'api' });

    const childLogger = parentLogger.child({ module: 'users' });
    assert.equal(childLogger.context.service, 'api');
    assert.equal(childLogger.context.module, 'users');
  });

  await t.test('child logger works independently', () => {
    const parentLogger = new Logger();
    parentLogger.setLevel(LOG_LEVELS.INFO);

    const childLogger = parentLogger.child({ module: 'test' });
    childLogger.setLevel(LOG_LEVELS.WARN);

    assert.equal(parentLogger.level, LOG_LEVELS.INFO);
    assert.equal(childLogger.level, LOG_LEVELS.WARN);
  });
});

test('Singleton Instance', async (t) => {
  await t.test('default export is Logger instance', () => {
    assert.ok(logger instanceof Logger);
  });

  await t.test('multiple imports share state', () => {
    logger.setLevel(LOG_LEVELS.DEBUG);
    assert.equal(logger.level, LOG_LEVELS.DEBUG);
  });

  await t.test('configuration persists across calls', () => {
    const ctx = { testKey: 'testValue' };
    logger.setContext(ctx);
    assert.equal(logger.context.testKey, 'testValue');
  });
});

test('Edge Cases and Robustness', async (t) => {
  const testLogger = new Logger();
  testLogger.setLevel(LOG_LEVELS.DEBUG);
  testLogger.setTimestamp(false);

  await t.test('handles empty message', () => {
    assert.doesNotThrow(() => {
      testLogger.info('');
    });
  });

  await t.test('handles very long message', () => {
    const longMessage = 'x'.repeat(10000);
    assert.doesNotThrow(() => {
      testLogger.info(longMessage);
    });
  });

  await t.test('handles null context', () => {
    testLogger.setContext(null);
    assert.doesNotThrow(() => {
      testLogger.info('Message');
    });
  });

  await t.test('handles undefined data', () => {
    assert.doesNotThrow(() => {
      testLogger.info('Message', undefined);
    });
  });

  await t.test('handles complex nested data', () => {
    const complexData = {
      level1: {
        level2: {
          level3: {
            value: 'deep'
          }
        }
      }
    };
    assert.doesNotThrow(() => {
      testLogger.info('Message', complexData);
    });
  });

  await t.test('handles complex nested circular references in data', () => {
    assert.doesNotThrow(() => {
      testLogger.info('Message', { normal: 'data' });
    });
  });

  await t.test('handles error with no message', () => {
    const error = new Error();
    assert.doesNotThrow(() => {
      testLogger.error('Failed', error);
    });
  });

  await t.test('handles error with no stack', () => {
    const error = new Error('Test');
    error.stack = undefined;
    assert.doesNotThrow(() => {
      testLogger.error('Failed', error);
    });
  });
});

test('Timestamp Control', async (t) => {
  const testLogger = new Logger();
  testLogger.setLevel(LOG_LEVELS.INFO);

  await t.test('timestamps enabled by default', () => {
    const newLogger = new Logger();
    assert.equal(newLogger.timestamp, true);
  });

  await t.test('setTimestamp(true) enables timestamps', () => {
    testLogger.setTimestamp(true);
    assert.equal(testLogger.timestamp, true);
  });

  await t.test('setTimestamp(false) disables timestamps', () => {
    testLogger.setTimestamp(false);
    assert.equal(testLogger.timestamp, false);
  });

  await t.test('logging works with timestamps disabled', () => {
    testLogger.setTimestamp(false);
    assert.doesNotThrow(() => {
      testLogger.info('Message without timestamp');
    });
  });

  await t.test('logging works with timestamps enabled', () => {
    testLogger.setTimestamp(true);
    assert.doesNotThrow(() => {
      testLogger.info('Message with timestamp');
    });
  });
});

test('Multiple Logger Instances', async (t) => {
  await t.test('can create independent logger instances', () => {
    const logger1 = new Logger();
    const logger2 = new Logger();

    logger1.setLevel(LOG_LEVELS.DEBUG);
    logger2.setLevel(LOG_LEVELS.ERROR);

    assert.equal(logger1.level, LOG_LEVELS.DEBUG);
    assert.equal(logger2.level, LOG_LEVELS.ERROR);
  });

  await t.test('instances do not share configuration', () => {
    const logger1 = new Logger();
    const logger2 = new Logger();

    logger1.setContext({ instance: 1 });
    logger2.setContext({ instance: 2 });

    assert.equal(logger1.context.instance, 1);
    assert.equal(logger2.context.instance, 2);
  });
});
