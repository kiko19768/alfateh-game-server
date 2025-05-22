"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Log levels
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 4] = "FATAL";
})(LogLevel || (LogLevel = {}));
class Logger {
    static setLogLevel(level) {
        if (typeof level === 'string') {
            switch (level.toLowerCase()) {
                case 'debug':
                    this.logLevel = LogLevel.DEBUG;
                    break;
                case 'info':
                    this.logLevel = LogLevel.INFO;
                    break;
                case 'warn':
                    this.logLevel = LogLevel.WARN;
                    break;
                case 'error':
                    this.logLevel = LogLevel.ERROR;
                    break;
                case 'fatal':
                    this.logLevel = LogLevel.FATAL;
                    break;
                default: this.logLevel = LogLevel.INFO;
            }
        }
        else {
            this.logLevel = level;
        }
    }
    static enableFileLogging(enabled, filePath) {
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
    static debug(message, ...args) {
        this.log(LogLevel.DEBUG, message, args);
    }
    static info(message, ...args) {
        this.log(LogLevel.INFO, message, args);
    }
    static warn(message, ...args) {
        this.log(LogLevel.WARN, message, args);
    }
    static error(message, ...args) {
        this.log(LogLevel.ERROR, message, args);
    }
    static fatal(message, ...args) {
        this.log(LogLevel.FATAL, message, args);
    }
    static log(level, message, args) {
        if (level < this.logLevel)
            return;
        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level];
        let logMessage = `[${timestamp}] [${levelName}] ${message}`;
        // Format any additional arguments
        if (args && args.length > 0) {
            args.forEach(arg => {
                if (arg instanceof Error) {
                    logMessage += `\n${arg.stack || arg.message}`;
                }
                else if (typeof arg === 'object') {
                    try {
                        logMessage += ` ${JSON.stringify(arg)}`;
                    }
                    catch (e) {
                        logMessage += ` [Object]`;
                    }
                }
                else {
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
            }
            catch (err) {
                console.error('Failed to write to log file:', err);
            }
        }
    }
}
exports.Logger = Logger;
Logger.logLevel = LogLevel.INFO;
Logger.logToConsole = true;
Logger.logToFile = false;
Logger.logFilePath = path.join(__dirname, '../../logs/server.log');
