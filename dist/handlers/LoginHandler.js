"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHandler = void 0;
const AuthService_1 = require("../services/AuthService");
const Logger_1 = require("../utils/Logger");
class LoginHandler {
    constructor(playerManager) {
        this.playerManager = playerManager;
    }
    async handleLogin(ws, data) {
        try {
            const { username, password } = data;
            if (!username || !password) {
                return this.sendError(ws, 'Username and password are required');
            }
            const player = await this.playerManager.authenticatePlayer(username, password);
            if (player) {
                // Generate JWT token
                const token = AuthService_1.AuthService.generateToken(player.id, player.username);
                // Send success response
                ws.send(JSON.stringify({
                    type: 'login_success',
                    data: {
                        player,
                        token
                    }
                }));
                Logger_1.Logger.info(`Player logged in: ${username}`);
            }
            else {
                this.sendError(ws, 'Invalid username or password');
            }
        }
        catch (error) {
            Logger_1.Logger.error('Login error:', error);
            this.sendError(ws, 'An error occurred during login');
        }
    }
    async handleRegistration(ws, data) {
        try {
            const { username, password, email } = data;
            if (!username || !password || !email) {
                return this.sendError(ws, 'Username, password, and email are required');
            }
            // Validate input
            if (username.length < 3) {
                return this.sendError(ws, 'Username must be at least 3 characters');
            }
            if (password.length < 6) {
                return this.sendError(ws, 'Password must be at least 6 characters');
            }
            // Create new player
            const player = await this.playerManager.createPlayer(username, password, email);
            if (player) {
                // Generate JWT token
                const token = AuthService_1.AuthService.generateToken(player.id, player.username);
                // Send success response
                ws.send(JSON.stringify({
                    type: 'registration_success',
                    data: {
                        player,
                        token
                    }
                }));
                Logger_1.Logger.info(`New player registered: ${username}`);
            }
            else {
                this.sendError(ws, 'Username or email already exists');
            }
        }
        catch (error) {
            Logger_1.Logger.error('Registration error:', error);
            this.sendError(ws, 'An error occurred during registration');
        }
    }
    sendError(ws, message) {
        ws.send(JSON.stringify({
            type: 'error',
            message
        }));
    }
}
exports.LoginHandler = LoginHandler;
