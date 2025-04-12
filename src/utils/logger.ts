/**
 * 日志级别
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 当前日志级别
 * Current log level
 */
let currentLogLevel = LogLevel.INFO;

/**
 * 设置日志级别
 * Set log level
 *
 * @param level 日志级别
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * 调试日志
 * Debug log
 *
 * @param args 日志参数
 */
export function debug(...args: any[]): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    // eslint-disable-next-line no-console
    console.debug("[DEBUG]", ...args);
  }
}

/**
 * 信息日志
 * Info log
 *
 * @param args 日志参数
 */
export function info(...args: any[]): void {
  if (currentLogLevel <= LogLevel.INFO) {
    // eslint-disable-next-line no-console
    console.info("[INFO]", ...args);
  }
}

/**
 * 警告日志
 * Warning log
 *
 * @param args 日志参数
 */
export function warn(...args: any[]): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn("[WARN]", ...args);
  }
}

/**
 * 错误日志
 * Error log
 *
 * @param args 日志参数
 */
export function error(...args: any[]): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error("[ERROR]", ...args);
  }
}

/**
 * 通用日志
 * General log
 *
 * @param args 日志参数
 */
export function log(...args: any[]): void {
  // eslint-disable-next-line no-console
  console.log(...args);
}
