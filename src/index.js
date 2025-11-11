import Logger from './logger.js';
import { LOG_LEVELS, LEVEL_NAMES } from './levels.js';

const loggerInstance = new Logger();

export default loggerInstance;

export { Logger, LOG_LEVELS, LEVEL_NAMES };
