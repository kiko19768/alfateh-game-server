import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const Config = {
    // Server
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // MongoDB
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/alfateh_game',
    DB_NAME: process.env.DB_NAME || 'alfateh_game',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'default_secret_key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Game Settings
    MAX_PLAYERS_PER_INSTANCE: parseInt(process.env.MAX_PLAYERS_PER_INSTANCE || '100'),
    SAVE_INTERVAL: parseInt(process.env.SAVE_INTERVAL || '300000'),

    // Paths
    ASSETS_PATH: path.join(__dirname, '../../assets'),
    CONFIG_PATH: path.join(__dirname, '../../config'),

    // WebSocket
    WS_PING_INTERVAL: 30000,
    WS_TIMEOUT: 60000,

    // Game Balance
    EXPERIENCE_MULTIPLIER: 1.0,
    GOLD_MULTIPLIER: 1.0,
    DROP_RATE_MULTIPLIER: 1.0,

    // Feature Flags
    ENABLE_PVP: true,
    ENABLE_TRADING: true,
    ENABLE_GUILDS: true,
    ENABLE_EVENTS: true,

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',
    LOG_FILE_PATH: path.join(__dirname, '../../logs/server.log'),
} as const;