declare const COLORS: {
    cyan: string;
    yellow: string;
    red: string;
    green: string;
    gray: string;
    white: string;
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
declare class LoggerInternal {
    private static options;
    static configure(options: LoggerOptions): void;
    static info(message: string): void;
    static warn(message: string): void;
    static error(message: string): void;
    static success(message: string): void;
    static debug(message: string): void;
}
import type { MiddlewareFunction } from './MiddlewareManager.js';
export declare function Logger(options?: LoggerOptions): MiddlewareFunction;
export declare namespace Logger {
    var info: (message: string) => void;
    var warn: (message: string) => void;
    var error: (message: string) => void;
    var success: (message: string) => void;
    var debug: (message: string) => void;
    var configure: (options: LoggerOptions) => void;
}
export { LoggerInternal };
//# sourceMappingURL=Logger.d.ts.map