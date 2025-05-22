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
exports.GameServer = void 0;
const WebSocket = __importStar(require("ws"));
const http_1 = require("http");
const database_1 = require("./config/database");
const schemas_1 = require("./models/schemas");
const GameLoop_1 = require("./utils/GameLoop");
const PlayerManager_1 = require("./managers/PlayerManager");
const BattleManager_1 = require("./managers/BattleManager");
const GuildManager_1 = require("./managers/GuildManager");
const EventManager_1 = require("./managers/EventManager");
const MarketManager_1 = require("./managers/MarketManager");
const LoginHandler_1 = require("./handlers/LoginHandler");
const Logger_1 = require("./utils/Logger");
class GameServer {
    constructor() {
        this.initializeServer();
    }
    async initializeServer() {
        try {
            // Initialize database connection
            const dbConnection = database_1.DatabaseConnection.getInstance();
            const mongoDb = await dbConnection.getDatabase();
            this.db = new schemas_1.DatabaseCollections(mongoDb);
            await this.db.initialize();
            // Create HTTP server
            const server = (0, http_1.createServer)();
            // Create WebSocket server
            this.wss = new WebSocket.Server({ server });
            // Initialize managers
            this.playerManager = new PlayerManager_1.PlayerManager(this.db);
            this.battleManager = new BattleManager_1.BattleManager();
            this.guildManager = new GuildManager_1.GuildManager(mongoDb);
            this.eventManager = new EventManager_1.EventManager();
            this.marketManager = new MarketManager_1.MarketManager(mongoDb);
            // Initialize handlers
            this.loginHandler = new LoginHandler_1.LoginHandler(this.playerManager);
            // Initialize game loop
            this.gameLoop = new GameLoop_1.GameLoop();
            this.gameLoop.addTask('updateBattles', () => this.battleManager.update());
            this.gameLoop.addTask('checkEvents', () => this.eventManager.checkEvents());
            this.gameLoop.addTask('updateMarket', () => this.marketManager.update());
            // Setup WebSocket handlers
            this.setupWebSocket();
            // Start server
            const PORT = process.env.PORT || 3000;
            server.listen(PORT, () => {
                Logger_1.Logger.info(`Game server started on port ${PORT}`);
            });
        }
        catch (error) {
            Logger_1.Logger.error('Failed to initialize server:', error);
            process.exit(1);
        }
    }
    setupWebSocket() {
        this.wss.on('connection', async (ws) => {
            Logger_1.Logger.info('New client connected');
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, data);
                }
                catch (error) {
                    Logger_1.Logger.error('Error handling message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });
            ws.on('close', () => {
                Logger_1.Logger.info('Client disconnected');
                this.handleDisconnect(ws);
            });
            // Send initial connection success
            ws.send(JSON.stringify({
                type: 'connection_success',
                message: 'Connected to Al-Fateh game server'
            }));
        });
    }
    async handleMessage(ws, message) {
        const { type, data } = message;
        switch (type) {
            case 'login':
                await this.loginHandler.handleLogin(ws, data);
                break;
            case 'register':
                await this.loginHandler.handleRegistration(ws, data);
                break;
            case 'character_create':
                await this.handleCharacterCreation(ws, data);
                break;
            case 'game_action':
                await this.handleGameAction(ws, data);
                break;
            case 'chat':
                await this.handleChat(ws, data);
                break;
            case 'guild':
                await this.handleGuildAction(ws, data);
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown message type'
                }));
        }
    }
    async handleCharacterCreation(ws, data) {
        try {
            const { playerId, characterData } = data;
            const newCharacter = await this.playerManager.createCharacter(playerId, characterData);
            if (newCharacter) {
                ws.send(JSON.stringify({
                    type: 'character_creation_success',
                    data: newCharacter
                }));
            }
            else {
                ws.send(JSON.stringify({
                    type: 'character_creation_failed',
                    message: 'Failed to create character'
                }));
            }
        }
        catch (error) {
            Logger_1.Logger.error('Character creation error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Character creation failed'
            }));
        }
    }
    async handleGameAction(ws, data) {
        try {
            const { playerId, action, actionData } = data;
            switch (action) {
                case 'move':
                    await this.playerManager.updatePlayerPosition(playerId, actionData.position);
                    this.broadcastToNearbyPlayers(playerId, {
                        type: 'player_moved',
                        data: { playerId, position: actionData.position }
                    });
                    break;
                case 'attack':
                    const battleResult = await this.battleManager.processAttack(playerId, actionData.targetId, actionData.skillId);
                    this.broadcastToBattleParticipants(battleResult);
                    break;
                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Unknown game action'
                    }));
            }
        }
        catch (error) {
            Logger_1.Logger.error('Game action error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process game action'
            }));
        }
    }
    async handleChat(ws, data) {
        try {
            const { playerId, message, channel } = data;
            switch (channel) {
                case 'world':
                    this.broadcastToAll({
                        type: 'chat',
                        data: { playerId, message, channel }
                    });
                    break;
                case 'guild':
                    const guildId = await this.playerManager.getPlayerGuildId(playerId);
                    if (guildId) {
                        this.broadcastToGuild(guildId, {
                            type: 'chat',
                            data: { playerId, message, channel }
                        });
                    }
                    break;
                case 'private':
                    const { targetId } = data;
                    this.sendToPlayer(targetId, {
                        type: 'chat',
                        data: { playerId, message, channel }
                    });
                    break;
            }
        }
        catch (error) {
            Logger_1.Logger.error('Chat error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to send chat message'
            }));
        }
    }
    async handleGuildAction(ws, data) {
        try {
            const { action, guildId, playerId } = data;
            switch (action) {
                case 'create':
                    const newGuild = await this.guildManager.createGuild(data.guildData);
                    if (newGuild) {
                        ws.send(JSON.stringify({
                            type: 'guild_creation_success',
                            data: newGuild
                        }));
                    }
                    else {
                        ws.send(JSON.stringify({
                            type: 'guild_creation_failed',
                            message: 'Failed to create guild'
                        }));
                    }
                    break;
                case 'join':
                    const joined = await this.guildManager.addMember(guildId, playerId);
                    if (joined) {
                        ws.send(JSON.stringify({
                            type: 'guild_join_success',
                            data: { guildId }
                        }));
                        this.broadcastToGuild(guildId, {
                            type: 'guild_member_joined',
                            data: { playerId }
                        });
                    }
                    else {
                        ws.send(JSON.stringify({
                            type: 'guild_join_failed',
                            message: 'Failed to join guild'
                        }));
                    }
                    break;
                case 'leave':
                    const left = await this.guildManager.removeMember(guildId, playerId);
                    if (left) {
                        ws.send(JSON.stringify({
                            type: 'guild_leave_success'
                        }));
                        this.broadcastToGuild(guildId, {
                            type: 'guild_member_left',
                            data: { playerId }
                        });
                    }
                    else {
                        ws.send(JSON.stringify({
                            type: 'guild_leave_failed',
                            message: 'Failed to leave guild'
                        }));
                    }
                    break;
                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Unknown guild action'
                    }));
            }
        }
        catch (error) {
            Logger_1.Logger.error('Guild action error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process guild action'
            }));
        }
    }
    handleDisconnect(ws) {
        // Clean up player session, save state, etc.
        // This would typically involve looking up the player ID associated with this WebSocket
        // and then updating their online status, saving their state, etc.
    }
    broadcastToAll(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    broadcastToNearbyPlayers(playerId, message) {
        // In a real implementation, we would use spatial partitioning
        // For now, just broadcast to all as a simple implementation
        this.broadcastToAll(message);
    }
    broadcastToBattleParticipants(battleResult) {
        // Send battle results to all participants
        const { attacker, target } = battleResult;
        this.sendToPlayer(attacker, {
            type: 'battle_update',
            data: battleResult
        });
        this.sendToPlayer(target, {
            type: 'battle_update',
            data: battleResult
        });
    }
    broadcastToGuild(guildId, message) {
        // This would involve looking up all online players in the guild
        // and sending the message to each of them
        // For simplicity, we'll just broadcast to all for now
        this.broadcastToAll(message);
    }
    sendToPlayer(playerId, message) {
        // This would involve looking up the WebSocket connection for this player
        // and sending the message directly to them
        // For simplicity, we'll just broadcast to all for now
        this.broadcastToAll(message);
    }
    start() {
        this.gameLoop.start();
        Logger_1.Logger.info('Game server is running');
    }
}
exports.GameServer = GameServer;
// Start the server
const gameServer = new GameServer();
gameServer.start();
