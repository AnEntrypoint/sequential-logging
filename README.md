# tasker-logging

Consolidated logging service utility for sequential-ecosystem packages. Provides a singleton logger with support for multiple output formats, lazy evaluation, and contextual logging.

## Features

- **Singleton pattern**: Single logger instance across the entire application
- **Lazy evaluation**: Functions are only called if the message will actually be logged
- **Multiple output formats**: CLI (default), server, and JSON
- **Contextual logging**: Add context data that's included in all subsequent logs
- **Child loggers**: Create child loggers with additional context
- **No dependencies**: Pure JavaScript, works on Node.js, Deno, Bun
- **Ground truth logging**: Real output to stdout/stderr, no mocks or fallbacks

## Installation

```bash
npm install tasker-logging
```

## Quick Start

```javascript
import logger from 'tasker-logging';

logger.setLevel('INFO');
logger.info('Application started');
logger.warn('This is a warning', { code: 'WARN_001' });
logger.error('Operation failed', new Error('Something broke'));
```

## API Reference

### Log Levels

- `DEBUG` (0): Detailed diagnostic information
- `INFO` (1): General informational messages
- `WARN` (2): Warning messages
- `ERROR` (3): Error messages

### Methods

#### `setLevel(level: string | number): void`

Set the minimum log level. Messages below this level are ignored.

```javascript
logger.setLevel('DEBUG');    // Accept all levels
logger.setLevel('INFO');     // Skip DEBUG messages
logger.setLevel('WARN');     // Only WARN and ERROR
logger.setLevel('ERROR');    // Only ERROR
logger.setLevel(0);          // Same as 'DEBUG'
```

#### `debug(msg: string, data?: object | function): void`

Log a debug message.

```javascript
logger.debug('Variable state', { x: 10, y: 20 });

// Lazy evaluation - function only called if DEBUG level is active
logger.debug('Expensive data', () => {
  return processLargeDataSet();
});
```

#### `info(msg: string, data?: object | function): void`

Log an informational message.

```javascript
logger.info('User logged in', { userId: '123', email: 'user@example.com' });
```

#### `warn(msg: string, data?: object | function): void`

Log a warning message (writes to stderr).

```javascript
logger.warn('Deprecated API used', { api: 'oldMethod', replacement: 'newMethod' });
```

#### `error(msg: string, err?: Error | object | function, data?: object | function): void`

Log an error message (writes to stderr). If an Error object is passed, it's automatically extracted into the log data.

```javascript
// With Error object
try {
  // ... some code
} catch (e) {
  logger.error('Request failed', e, { url: 'https://api.example.com' });
}

// With object data
logger.error('Operation failed', { code: 'OP_001', retry: false });

// With lazy data evaluation
logger.error('Processing failed', err, () => ({
  input: largeInput,
  timestamp: Date.now()
}));
```

#### `setContext(context: object): void`

Set contextual data that will be included in all subsequent log messages.

```javascript
logger.setContext({
  service: 'auth-service',
  environment: 'production',
  version: '1.0.0'
});

logger.info('User authenticated');
// Output: [service=auth-service environment=production version=1.0.0] User authenticated
```

#### `addContext(key: string, value: any): void`

Add a single key-value pair to the context.

```javascript
logger.addContext('requestId', '550e8400-e29b-41d4-a716-446655440000');
logger.addContext('userId', '12345');
```

#### `setOutputFormat(format: 'cli' | 'server' | 'json'): void`

Set the output format for log messages.

```javascript
// CLI format (default) - human-readable with key=value context
// [service=auth userId=123] User logged in

logger.setOutputFormat('cli');
logger.info('User logged in');

// Server format - structured with context in JSON
// [INFO] {"service":"auth","userId":"123"} User logged in

logger.setOutputFormat('server');
logger.info('User logged in');

// JSON format - pure JSON output, one object per line
// {"level":"INFO","message":"User logged in","service":"auth","userId":"123","timestamp":"..."}

logger.setOutputFormat('json');
logger.info('User logged in');
```

#### `setTimestamp(enabled: boolean): void`

Enable or disable timestamp prefixes in log messages.

```javascript
logger.setTimestamp(true);   // [2025-11-04T21:17:06.117Z] Message...
logger.setTimestamp(false);  // Message...
```

#### `child(context: object): Logger`

Create a child logger that inherits all parent settings but with additional context.

```javascript
const childLogger = logger.child({
  module: 'payment',
  transactionId: 'txn_12345'
});

childLogger.info('Processing payment');
// Output includes both parent and child context
```

## Output Format Examples

### CLI Format (default)

```
[2025-11-04T21:17:06.117Z] [service=auth userId=123] User authenticated {"ipAddress":"192.168.1.1"}
[2025-11-04T21:17:06.120Z] [service=auth userId=123] Invalid token {"error":"Token expired"}
```

### Server Format

```
[2025-11-04T21:17:06.117Z] [INFO] {"service":"auth","userId":"123"} User authenticated {"ipAddress":"192.168.1.1"}
[2025-11-04T21:17:06.120Z] [ERROR] {"service":"auth","userId":"123"} Operation failed {"error":{"name":"Error","message":"Token expired"}}
```

### JSON Format

```json
{"level":"INFO","message":"User authenticated","service":"auth","userId":"123","data":{"ipAddress":"192.168.1.1"},"timestamp":"2025-11-04T21:17:06.117Z"}
{"level":"ERROR","message":"Operation failed","service":"auth","userId":"123","data":{"error":{"name":"Error","message":"Token expired"}},"timestamp":"2025-11-04T21:17:06.120Z"}
```

## Usage Examples

### Basic Application Logging

```javascript
import logger from 'tasker-logging';

logger.setLevel('INFO');

logger.info('Server started', { port: 3000 });
logger.warn('Deprecated config used', { key: 'oldKey' });
logger.error('Database connection failed', err, { host: 'db.example.com' });
```

### Task Execution Context

```javascript
import logger from 'tasker-logging';

function executeTask(taskId, userId) {
  logger.setContext({ taskId, userId });

  logger.info('Task started');
  // All subsequent logs include taskId and userId

  logger.debug('Loading configuration', () => loadConfig()); // Lazy!
  logger.info('Configuration loaded');

  logger.warn('Retrying operation', { attempt: 2 });
}
```

### Service-Specific Child Loggers

```javascript
import logger from 'tasker-logging';

logger.setContext({ app: 'ecosystem' });

function authService() {
  const authLogger = logger.child({ service: 'auth' });
  authLogger.info('User login attempt');
}

function paymentService() {
  const paymentLogger = logger.child({ service: 'payment' });
  paymentLogger.info('Processing payment');
}
```

### JSON Logging for Log Aggregation

```javascript
import logger from 'tasker-logging';

logger.setOutputFormat('json');
logger.setTimestamp(true);
logger.setContext({ environment: 'production' });

// Output is perfect for log aggregation systems (ELK, Splunk, etc.)
logger.info('Request received', { method: 'POST', path: '/api/users' });
logger.error('Request failed', err, { status: 500 });
```

### Expensive Computations with Lazy Evaluation

```javascript
import logger from 'tasker-logging';

logger.setLevel('WARN');

// This function is NEVER called because DEBUG < WARN
logger.debug('State dump', () => {
  return dumpCompleteApplicationState();  // Expensive!
});

// This function IS called because INFO >= INFO
logger.info('Progress', () => {
  return calculateProgress();  // Cheaper computation
});
```

## Exports

```javascript
// Default singleton instance
import logger from 'tasker-logging';

// Logger class (if you need a separate instance)
import { Logger } from 'tasker-logging';

// Log levels constants
import { LOG_LEVELS, LEVEL_NAMES } from 'tasker-logging/levels';

// Or destructure from main export
import logger, { Logger, LOG_LEVELS, LEVEL_NAMES } from 'tasker-logging';
```

## Stream Output

- **stdout**: DEBUG, INFO messages
- **stderr**: WARN, ERROR messages

## Error Handling

Errors are automatically normalized:

```javascript
logger.error('Operation failed', err, { operation: 'fetch' });

// err is automatically converted to:
// {
//   error: {
//     name: 'Error',
//     message: 'Something went wrong',
//     stack: 'Error: Something went wrong\n    at ...'
//   }
// }
```

## Testing

Run the test suite:

```bash
npm test
# or
node tests/test-logger.js
```

## Design Principles

1. **No dependencies**: Pure JavaScript, no external libraries
2. **Singleton by default**: Single logger instance for simplicity
3. **Extensible**: Create child loggers with additional context
4. **Lazy evaluation**: Functions only execute if needed
5. **Ground truth**: Real output to stdout/stderr, no mocks
6. **Multi-format**: Support multiple output formats for different contexts
7. **Cross-platform**: Works on Node.js, Deno, Bun without changes

## License

MIT
