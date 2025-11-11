import logger, { Logger, LOG_LEVELS, LEVEL_NAMES } from '../src/index.js';

console.log('=== tasker-logging Test Suite ===\n');

console.log('1. Testing log levels...');
console.log('LOG_LEVELS:', LOG_LEVELS);
console.log('LEVEL_NAMES:', LEVEL_NAMES);

console.log('\n2. Testing setLevel() with string...');
logger.setLevel('DEBUG');
console.log('Set to DEBUG - should log all');
logger.info('Test message at INFO level');

logger.setLevel('WARN');
console.log('Set to WARN - should skip DEBUG and INFO');
logger.info('This should NOT appear (below WARN)');
logger.warn('This should appear (at WARN)');

console.log('\n3. Testing setLevel() with number...');
logger.setLevel(LOG_LEVELS.ERROR);
console.log('Set to ERROR (level 3) - should only log ERROR');
logger.warn('This should NOT appear (below ERROR)');
logger.error('Test error message', new Error('Sample error'), { code: 'TEST_001' });

console.log('\n4. Testing context...');
logger.setLevel(LOG_LEVELS.INFO);
logger.setContext({ service: 'test', env: 'development' });
logger.info('Message with context');

console.log('\n5. Testing addContext...');
logger.addContext('userId', '12345');
logger.info('Message with added context');

console.log('\n6. Testing output formats...');
logger.setOutputFormat('json');
logger.info('JSON format message', { value: 42 });

logger.setOutputFormat('server');
logger.info('Server format message', { value: 42 });

logger.setOutputFormat('cli');
logger.info('CLI format message', { value: 42 });

console.log('\n7. Testing lazy evaluation...');
let callCount = 0;
const expensiveFn = () => {
  callCount++;
  return { expensive: true, callCount };
};

logger.setLevel(LOG_LEVELS.WARN);
logger.debug('Debug with expensive fn', expensiveFn);
console.log(`Function called: ${callCount} times (should be 0 because DEBUG is below WARN)`);

logger.setLevel(LOG_LEVELS.DEBUG);
logger.debug('Debug with expensive fn', expensiveFn);
console.log(`Function called: ${callCount} times (should be 1 because DEBUG is at level)`);

console.log('\n8. Testing error handling...');
logger.setLevel(LOG_LEVELS.ERROR);
const err = new Error('Something went wrong');
err.stack = 'Error: Something went wrong\n    at test (test-logger.js:10)';
logger.error('Operation failed', err, { operation: 'fetch', url: 'https://api.example.com' });

console.log('\n9. Testing error handling with lazy data...');
logger.error('Operation failed', err, () => ({ operation: 'fetch', url: 'https://api.example.com' }));

console.log('\n10. Testing child logger...');
logger.setLevel(LOG_LEVELS.INFO);
const childLogger = logger.child({ module: 'auth', userId: '123' });
childLogger.info('Child logger message');

console.log('\n11. Testing invalid level...');
try {
  logger.setLevel('INVALID');
} catch (e) {
  console.log(`Caught expected error: ${e.message}`);
}

console.log('\n12. Testing timestamp control...');
logger.setTimestamp(true);
logger.info('Message with timestamp');

logger.setTimestamp(false);
logger.info('Message without timestamp');

console.log('\n13. Testing all log levels in sequence...');
logger.setLevel(LOG_LEVELS.DEBUG);
logger.setTimestamp(false);
logger.setOutputFormat('cli');
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warn message');
logger.error('Error message', new Error('Test error'));

console.log('\n=== All tests completed ===');
