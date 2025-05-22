import * as fs from 'fs';
import * as path from 'path';

// Log levels
enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}

export class Logger {
    private static logLevel: LogLevel = LogLevel.INFO;
    private static logToConsole: boolean = true;
    private static logToFile: boolean = false;
    private static logFilePath: string = path.join(__dirname, '../../logs/server.log');

    static setLogLevel(level: LogLevel | string) {
        if (typeof level === 'string') {
            switch (level.toLowerCase()) {
                case 'debug': this.logLevel = LogLevel.DEBUG; break;
                case 'info': this.logLevel = LogLevel.INFO; break;
                case 'warn': this.logLevel = LogLevel.WARN; break;
                case 'error': this.logLevel = LogLevel.ERROR; break;
                case 'fatal': this.logLevel = LogLevel.FATAL; break;
                default: this.logLevel = LogLevel.INFO;
            }
        } else {
            this.logLevel = level;
        }
    }

    static enableFileLogging(enabled: boolean, filePath?: string) {
        this.logToFile = enabled;
        if (filePath) {
            this.logFilePath = filePath;
        }

        // Create logs directory if it doesn't exist
        if (enabled) {
            const dir = path.dirname(this.logFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    static debug(message: string, ...args: any[]) {
        this.log(LogLevel.DEBUG, message, args);
    }

    static info(message: string, ...args: any[]) {
        this.log(LogLevel.INFO, message, args);
    }

    static warn(message: string, ...args: any[]) {
        this.log(LogLevel.WARN, message, args);
    }

    static error(message: string, ...args: any[]) {
        this.log(LogLevel.ERROR, message, args);
    }

    static fatal(message: string, ...args: any[]) {
        this.log(LogLevel.FATAL, message, args);
    }

    private static log(level: LogLevel, message: string, args: any[]) {
        if (level < this.logLevel) return;

        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level];
        
        let logMessage = `[${timestamp}] [${levelName}] ${message}`;
        
        // Format any additional arguments
        if (args && args.length > 0) {
            args.forEach(arg => {
                if (arg instanceof Error) {
                    logMessage += `\n${arg.stack || arg.message}`;
                } else if (typeof arg === 'object') {
                    try {
                        logMessage += ` ${JSON.stringify(arg)}`;
                    } catch (e) {
                        logMessage += ` [Object]`;
                    }
                } else {
                    logMessage += ` ${arg}`;
                }
            });
        }

        // Console logging
        if (this.logToConsole) {
            switch (level) {
                case LogLevel.DEBUG:
                    console.debug(logMessage);
                    break;
                case LogLevel.INFO:
                    console.info(logMessage);
                    break;
                case LogLevel.WARN:
                    console.warn(logMessage);
                    break;
                case LogLevel.ERROR:
                case LogLevel.FATAL:
                    console.error(logMessage);
                    break;
            }
        }

        // File logging
        if (this.logToFile) {
            try {
                fs.appendFileSync(this.logFilePath, logMessage + '\n');
            } catch (err) {
                console.error('Failed to write to log file:', err);
            }
        }
    }
}