import * as jwt from 'jsonwebtoken';
import { Config } from '../config';

export class AuthService {
    private static readonly JWT_SECRET = Config.JWT_SECRET || 'default_secret_key';
    private static readonly JWT_EXPIRES_IN = Config.JWT_EXPIRES_IN || '7d';

    /**
     * Generate a JWT token for a player
     */
    static generateToken(playerId: string, username: string): string {
        return jwt.sign(
            { 
                playerId, 
                username,
                timestamp: Date.now()
            },
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN }
        );
    }

    /**
     * Verify a JWT token
     */
    static verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract player ID from token
     */
    static getPlayerIdFromToken(token: string): string | null {
        const decoded = this.verifyToken(token);
        return decoded?.playerId || null;
    }

    /**
     * Extract authorization token from WebSocket request headers
     */
    static extractTokenFromHeaders(headers: any): string | null {
        const authorization = headers.authorization;
        if (!authorization) return null;

        const parts = authorization.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

        return parts[1];
    }
}