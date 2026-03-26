"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerInternal = void 0;
exports.Logger = Logger;
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
function timestamp() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    return `${COLORS.gray}[${h}:${m}:${s}]${RESET}`;
}
class LoggerInternal {
    static configure(options) {
        this.options = {
            ...this.options,
            ...options,
            colors: { ...this.options.colors, ...options.colors },
        };
    }
    static info(message) {
        const color = COLORS[this.options.colors?.info || 'cyan'];
        console.log(`${timestamp()} ${BOLD}${color}[INFO]${RESET} ${message}`);
    }
    static warn(message) {
        const color = COLORS[this.options.colors?.warn || 'yellow'];
        console.warn(`${timestamp()} ${BOLD}${color}[WARN]${RESET} ${message}`);
    }
    static error(message) {
        const color = COLORS[this.options.colors?.error || 'red'];
        console.error(`${timestamp()} ${BOLD}${color}[ERROR]${RESET} ${message}`);
    }
    static success(message) {
        const color = COLORS[this.options.colors?.success || 'green'];
        console.log(`${timestamp()} ${BOLD}${color}[OK]${RESET} ${message}`);
    }
    static debug(message) {
        if (process.env.DEBUG) {
            const color = COLORS[this.options.colors?.debug || 'gray'];
            console.log(`${timestamp()} ${BOLD}${color}[DEBUG]${RESET} ${message}`);
        }
    }
}
exports.LoggerInternal = LoggerInternal;
LoggerInternal.options = {
    colors: {
        info: 'cyan',
        warn: 'yellow',
        error: 'red',
        success: 'green',
        debug: 'gray',
    },
};
function Logger(options) {
    if (options)
        LoggerInternal.configure(options);
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
Logger.info = (message) => LoggerInternal.info(message);
Logger.warn = (message) => LoggerInternal.warn(message);
Logger.error = (message) => LoggerInternal.error(message);
Logger.success = (message) => LoggerInternal.success(message);
Logger.debug = (message) => LoggerInternal.debug(message);
Logger.configure = (options) => LoggerInternal.configure(options);
//# sourceMappingURL=Logger.js.map