# Sequential Logging

Consolidated logging for sequential-ecosystem packages.

## Installation

```bash
npm install sequential-logging
```

## Usage

```javascript
import logger from 'sequential-logging';

logger.setLevel('INFO');
logger.info('Application started');
logger.warn('This is a warning', { code: 'WARN_001' });
logger.error('Operation failed', new Error('Something broke'));
```

## Log Levels

- `DEBUG` (0)
- `INFO` (1)
- `WARN` (2)
- `ERROR` (3)

## Methods

```javascript
logger.setLevel('DEBUG');
logger.debug('Variable state', { x: 10 });
logger.info('User logged in', { userId: '123' });
logger.warn('Deprecated API', { api: 'oldMethod' });
logger.error('Failed', err, { context: 'data' });
```

## Context

```javascript
logger.setContext({ service: 'auth', version: '1.0' });
logger.addContext('requestId', '550e8400');
```

## Output Formats

```javascript
logger.setOutputFormat('cli');
logger.setOutputFormat('server');
logger.setOutputFormat('json');
```

## Child Loggers

```javascript
const childLogger = logger.child({ module: 'payment' });
childLogger.info('Processing');
```

## Lazy Evaluation

```javascript
logger.debug('Expensive data', () => computeExpensiveData());
```

## License

MIT
