# CLAUDE.md - tasker-logging

## Project Overview

**tasker-logging** is a lightweight, dependency-free logging utility for the sequential-ecosystem. It provides a singleton logger with multiple output formats, lazy evaluation, and contextual logging capabilities.

**Core Design Principles:**
- Zero production dependencies (pure JavaScript)
- Singleton pattern for shared logger state
- Lazy evaluation for performance optimization
- Real output to stdout/stderr (no mocking)
- ES Modules (Node.js >= 18.0.0)

## Architecture

### Module Structure
```
src/
├── index.js      # Singleton instance + exports (entry point)
├── logger.js     # Core Logger class (160 lines)
└── levels.js     # Log level constants
```

### Key Design Patterns

**Singleton Pattern:** `src/index.js` exports a single shared logger instance used across the application.

**Lazy Evaluation:** Functions passed as data parameters are only executed if the message will be logged:
```javascript
logger.debug('Query', () => ({ results: expensiveOperation() }));
// expensiveOperation() only runs if DEBUG level is enabled
```

**Child Loggers:** Create specialized loggers that inherit parent settings but add context:
```javascript
const serviceLogger = logger.child({ service: 'api' });
```

## Core APIs

### Logger Class (src/logger.js)

**Configuration Methods:**
- `setLevel(level)` - Set minimum log level (0-3 or 'DEBUG'/'INFO'/'WARN'/'ERROR')
- `setContext(context)` - Set global context object
- `addContext(key, value)` - Add individual context property
- `setOutputFormat(format)` - Choose 'cli', 'server', or 'json'
- `setTimestamp(enabled)` - Enable/disable timestamps (default: true)

**Logging Methods:**
- `debug(msg, dataOrFn)` - DEBUG level → stdout
- `info(msg, dataOrFn)` - INFO level → stdout
- `warn(msg, dataOrFn)` - WARN level → stderr
- `error(msg, err, dataOrFn)` - ERROR level → stderr
  - Automatically extracts Error objects and adds to context

**Child Logger:**
- `child(context)` - Creates new logger with inherited settings + additional context

### Log Levels (src/levels.js)
```javascript
LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
LEVEL_NAMES = { 0: 'DEBUG', 1: 'INFO', 2: 'WARN', 3: 'ERROR' }
```

### Output Formats

**CLI (default)** - Human-readable for development:
```
[2024-03-14T10:30:00.000Z] [context] message { data: 'value' }
```

**Server** - Structured with log levels:
```
[2024-03-14T10:30:00.000Z] [INFO] {context} message { data: 'value' }
```

**JSON** - Line-delimited for log aggregation:
```json
{"timestamp":"2024-03-14T10:30:00.000Z","level":"INFO","message":"message","context":{},"data":{}}
```

## Exports & Import Paths

```javascript
// Default singleton instance
import logger from 'tasker-logging';

// Logger class for custom instances
import { Logger, LOG_LEVELS, LEVEL_NAMES } from 'tasker-logging';

// Just constants
import { LOG_LEVELS, LEVEL_NAMES } from 'tasker-logging/levels';

// Direct logger class
import { Logger } from 'tasker-logging/logger';
```

## External Dependencies

**Runtime Dependency:** `tasker-utils/timestamps` for `nowISO()` function
- Only imported and used if timestamps are enabled
- Located at: `src/logger.js:1`

**Production Dependencies:** None (zero npm dependencies)

## Code Conventions

### Private Methods
Uses `#` prefix for private methods (ES2022 private fields):
- `#shouldLog(level)` - Check if level should be logged
- `#formatMessage(level, msg, data, context)` - Format based on output format
- `#write(stream, output)` - Write to stdout/stderr

### Error Handling
The `error()` method automatically handles Error objects:
```javascript
logger.error('Failed', new Error('reason'));
// Extracts error.message and error.stack into context
```

For custom data with errors:
```javascript
logger.error('Failed', err, { additionalData: 'value' });
```

### Stream Behavior
- **stdout:** DEBUG, INFO levels
- **stderr:** WARN, ERROR levels

## Testing

**Test File:** `tests/test-logger.js` (97 lines)

**Run Tests:** `npm test` or `node tests/test-logger.js`

**Coverage:**
- Log level constants and setting (numeric/string)
- Context management (set/add)
- All output formats (cli/server/json)
- Lazy evaluation verification
- Error object handling
- Child logger creation and inheritance
- Invalid input error handling
- Timestamp enable/disable
- All log levels in sequence

**Test Pattern:** Direct execution with console output validation (no test framework).

## Common Workflows

### Development Setup
```javascript
import logger from 'tasker-logging';
logger.setLevel('DEBUG');
logger.setOutputFormat('cli');
```

### Production Server
```javascript
import logger from 'tasker-logging';
logger.setLevel('INFO');
logger.setOutputFormat('server');
```

### Log Aggregation Pipeline
```javascript
import logger from 'tasker-logging';
logger.setLevel('INFO');
logger.setOutputFormat('json');
// Pipe stdout/stderr to aggregation service
```

### Service-Specific Loggers
```javascript
import logger from 'tasker-logging';
const apiLogger = logger.child({ service: 'api' });
const dbLogger = logger.child({ service: 'database' });
```

## Important Considerations

### Performance
- **Always use lazy evaluation for expensive operations:**
  ```javascript
  // Good - only computes if DEBUG enabled
  logger.debug('Data', () => ({ results: heavyComputation() }));

  // Bad - always computes
  logger.debug('Data', { results: heavyComputation() });
  ```

### Singleton State
- The default export is a singleton - configuration affects all imports
- Use `child()` for isolated contexts, not new Logger instances
- Only create new Logger instances for completely independent logging systems

### Error Logging Best Practices
```javascript
// Preferred - automatic error extraction
logger.error('Operation failed', error);

// With additional context
logger.error('Database query failed', error, { query: 'SELECT ...' });

// String errors (less informative)
logger.error('Something went wrong', 'reason');
```

### Context Management
- Context is inherited by child loggers
- `setContext()` replaces entire context
- `addContext()` merges new properties
- Context appears in all subsequent logs

### Stream Redirection
When piping/redirecting output:
- Redirect both stdout and stderr for complete logs
- Use JSON format for structured log parsing
- Server format includes level in output for filtering

## File Modification Guidelines

### When Modifying logger.js
- Maintain private method naming (`#` prefix)
- Preserve lazy evaluation in `#formatMessage()`
- Keep stdout/stderr separation logic in `#write()`
- Update tests for any new features

### When Adding Features
- Keep zero-dependency principle
- Add tests to `tests/test-logger.js`
- Update README.md with examples
- Consider impact on all three output formats

### When Changing Exports
- Update `package.json` exports field
- Verify import paths still work
- Document in README.md

## Version & Compatibility

- **Version:** 1.0.0
- **License:** MIT
- **Node.js:** >= 18.0.0 (ES Modules + private fields)
- **Compatible Runtimes:** Node.js, Deno, Bun (ES Module support required)

## Related Ecosystem

Part of the **sequential-ecosystem** / **tasker** family:
- Uses `tasker-utils/timestamps` for ISO timestamp generation
- Designed for use across sequential-ecosystem packages
- Follows tasker naming conventions (tasker-*)
