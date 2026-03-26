const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const COLORS = {
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
};

export type LoggerColor = keyof typeof COLORS;

export interface LoggerOptions {
  colors?: {
    info?: LoggerColor;
    warn?: LoggerColor;
    error?: LoggerColor;
    success?: LoggerColor;
    debug?: LoggerColor;
  };
}

function timestamp(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `${COLORS.gray}[${h}:${m}:${s}]${RESET}`;
}

class LoggerInternal {
  private static options: LoggerOptions = {
    colors: {
      info: 'cyan',
      warn: 'yellow',
      error: 'red',
      success: 'green',
      debug: 'gray',
    },
  };

  static configure(options: LoggerOptions): void {
    this.options = {
      ...this.options,
      ...options,
      colors: { ...this.options.colors, ...options.colors },
    };
  }

  static info(message: string): void {
    const color = COLORS[this.options.colors?.info || 'cyan'];
    console.log(`${timestamp()} ${BOLD}${color}[INFO]${RESET} ${message}`);
  }

  static warn(message: string): void {
    const color = COLORS[this.options.colors?.warn || 'yellow'];
    console.warn(`${timestamp()} ${BOLD}${color}[WARN]${RESET} ${message}`);
  }

  static error(message: string): void {
    const color = COLORS[this.options.colors?.error || 'red'];
    console.error(`${timestamp()} ${BOLD}${color}[ERROR]${RESET} ${message}`);
  }

  static success(message: string): void {
    const color = COLORS[this.options.colors?.success || 'green'];
    console.log(`${timestamp()} ${BOLD}${color}[OK]${RESET} ${message}`);
  }

  static debug(message: string): void {
    if (process.env.DEBUG) {
      const color = COLORS[this.options.colors?.debug || 'gray'];
      console.log(`${timestamp()} ${BOLD}${color}[DEBUG]${RESET} ${message}`);
    }
  }
}

import type { MiddlewareFunction } from './MiddlewareManager.js';

export function Logger(options?: LoggerOptions): MiddlewareFunction {
  if (options) LoggerInternal.configure(options);

  return async (ctx, next) => {
    const start = Date.now();
    const type = ctx.isInteraction ? 'interaction' : 'message';
    const identifier = ctx.interaction?.commandName || ctx.args[0] || 'unknown';

    await next();

    const duration = Date.now() - start;
    LoggerInternal.info(`${ctx.user.tag} executed ${type}:${identifier} (${duration}ms)`);
  };
}

// Add static methods to Logger function for direct usage like Logger.info()
Logger.info = (message: string) => LoggerInternal.info(message);
Logger.warn = (message: string) => LoggerInternal.warn(message);
Logger.error = (message: string) => LoggerInternal.error(message);
Logger.success = (message: string) => LoggerInternal.success(message);
Logger.debug = (message: string) => LoggerInternal.debug(message);
Logger.configure = (options: LoggerOptions) => LoggerInternal.configure(options);

export { LoggerInternal };
