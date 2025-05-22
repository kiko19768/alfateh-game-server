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
exports.AuthService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const config_1 = require("../config");
class AuthService {
    /**
     * Generate a JWT token for a player
     */
    static generateToken(playerId, username) {
        return jwt.sign({
            playerId,
            username,
            timestamp: Date.now()
        }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    }
    /**
     * Verify a JWT token
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Extract player ID from token
     */
    static getPlayerIdFromToken(token) {
        const decoded = this.verifyToken(token);
        return decoded?.playerId || null;
    }
    /**
     * Extract authorization token from WebSocket request headers
     */
    static extractTokenFromHeaders(headers) {
        const authorization = headers.authorization;
        if (!authorization)
            return null;
        const parts = authorization.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer')
            return null;
        return parts[1];
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = config_1.Config.JWT_SECRET || 'default_secret_key';
AuthService.JWT_EXPIRES_IN = config_1.Config.JWT_EXPIRES_IN || '7d';
