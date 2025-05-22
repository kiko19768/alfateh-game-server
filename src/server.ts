import * as WebSocket from 'ws';
import { createServer } from 'http';
import { DatabaseConnection } from './config/database';
import { DatabaseCollections } from './models/schemas';
import { GameLoop } from './utils/GameLoop';
import { PlayerManager } from './managers/PlayerManager';
import { BattleManager } from './managers/BattleManager';
import { GuildManager } from './managers/GuildManager';
import { EventManager } from './managers/EventManager';
import { MarketManager } from './managers/MarketManager';
import { LoginHandler } from './handlers/LoginHandler';
import { Logger } from './utils/Logger';

export class GameServer {
    private wss!: WebSocket.Server;
    private gameLoop!: GameLoop;
    private playerManager!: PlayerManager;
    private battleManager!: BattleManager;
    private guildManager!: GuildManager;
    private eventManager!: EventManager;
    private marketManager!: MarketManager;
    private loginHandler!: LoginHandler;
    private db!: DatabaseCollections;

    constructor() {
        this.initializeServer();
    }

    private async initializeServer() {
        try {
            // Initialize database connection
            const dbConnection = DatabaseConnection.getInstance();
            const mongoDb = await dbConnection.getDatabase();
            this.db = new DatabaseCollections(mongoDb);
            await this.db.initialize();

            // Create HTTP server
            const server = createServer();
            
            // Create WebSocket server
            this.wss = new WebSocket.Server({ server });
            
            // Initialize managers
            this.playerManager = new PlayerManager(this.db);
            this.battleManager = new BattleManager();
            this.guildManager = new GuildManager(mongoDb);
            this.eventManager = new EventManager();
            this.marketManager = new MarketManager(mongoDb);

            // Initialize handlers
            this.loginHandler = new LoginHandler(this.playerManager);

            // Initialize game loop
            this.gameLoop = new GameLoop();
            this.gameLoop.addTask('updateBattles', () => this.battleManager.update());
            this.gameLoop.addTask('checkEvents', () => this.eventManager.checkEvents());
            this.gameLoop.addTask('updateMarket', () => this.marketManager.update());
            
            // Setup WebSocket handlers
            this.setupWebSocket();

            // Start server
            const PORT = process.env.PORT || 3000;
            server.listen(PORT, () => {
                Logger.info(`Game server started on port ${PORT}`);
            });

        } catch (error) {
            Logger.error('Failed to initialize server:', error);
            process.exit(1);
        }
    }

    private setupWebSocket() {
        this.wss.on('connection', async (ws: WebSocket) => {
            Logger.info('New client connected');

            ws.on('message', async (message: string) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(ws, data);
                } catch (error) {
                    Logger.error('Error handling message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                Logger.info('Client disconnected');
                this.handleDisconnect(ws);
            });

            // Send initial connection success
            ws.send(JSON.stringify({
                type: 'connection_success',
                message: 'Connected to Al-Fateh game server'
            }));
        });
    }

    private async handleMessage(ws: WebSocket, message: any) {
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

    private async handleCharacterCreation(ws: WebSocket, data: any) {
        try {
            const { playerId, characterData } = data;
            const newCharacter = await this.playerManager.createCharacter(playerId, characterData);
            
            if (newCharacter) {
                ws.send(JSON.stringify({
                    type: 'character_creation_success',
                    data: newCharacter
                }));
            } else {
                ws.send(JSON.stringify({
                    type: 'character_creation_failed',
                    message: 'Failed to create character'
                }));
            }
        } catch (error) {
            Logger.error('Character creation error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Character creation failed'
            }));
        }
    }

    private async handleGameAction(ws: WebSocket, data: any) {
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
                    const battleResult = await this.battleManager.processAttack(
                        playerId, 
                        actionData.targetId, 
                        actionData.skillId
                    );
                    this.broadcastToBattleParticipants(battleResult);
                    break;
                    
                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Unknown game action'
                    }));
            }
            
        } catch (error) {
            Logger.error('Game action error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process game action'
            }));
        }
    }

    private async handleChat(ws: WebSocket, data: any) {
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
        } catch (error) {
            Logger.error('Chat error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to send chat message'
            }));
        }
    }

    private async handleGuildAction(ws: WebSocket, data: any) {
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
                    } else {
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
                    } else {
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
                    } else {
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
        } catch (error) {
            Logger.error('Guild action error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process guild action'
            }));
        }
    }

    private handleDisconnect(ws: WebSocket) {
        // Clean up player session, save state, etc.
        // This would typically involve looking up the player ID associated with this WebSocket
        // and then updating their online status, saving their state, etc.
    }

    private broadcastToAll(message: any) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    private broadcastToNearbyPlayers(playerId: string, message: any) {
        // In a real implementation, we would use spatial partitioning
        // For now, just broadcast to all as a simple implementation
        this.broadcastToAll(message);
    }

    private broadcastToBattleParticipants(battleResult: any) {
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

    private broadcastToGuild(guildId: string, message: any) {
        // This would involve looking up all online players in the guild
        // and sending the message to each of them
        // For simplicity, we'll just broadcast to all for now
        this.broadcastToAll(message);
    }

    private sendToPlayer(playerId: string, message: any) {
        // This would involve looking up the WebSocket connection for this player
        // and sending the message directly to them
        // For simplicity, we'll just broadcast to all for now
        this.broadcastToAll(message);
    }

    public start() {
        this.gameLoop.start();
        Logger.info('Game server is running');
    }
}

// Start the server
const gameServer = new GameServer();
gameServer.start();