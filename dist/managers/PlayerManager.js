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
exports.PlayerManager = void 0;
const Logger_1 = require("../utils/Logger");
const bcrypt = __importStar(require("bcrypt"));
class PlayerManager {
    constructor(db) {
        this.db = db;
        this.onlinePlayers = new Map();
        this.playerSessions = new Map();
    }
    async authenticatePlayer(username, password) {
        try {
            const playerDoc = await this.db.players.findOne({ username });
            if (!playerDoc)
                return null;
            const isValid = await bcrypt.compare(password, playerDoc.password);
            if (!isValid)
                return null;
            // Update last login
            await this.db.players.updateOne({ _id: playerDoc._id }, { $set: { lastLogin: new Date() } });
            // Get player characters
            const characters = await this.db.characters.find({
                playerId: playerDoc._id?.toString()
            }).toArray();
            // Get player inventory
            const inventory = await this.db.inventory.findOne({
                playerId: playerDoc._id?.toString()
            });
            // Create player object with stripped password
            const player = {
                id: playerDoc._id,
                username: playerDoc.username,
                email: playerDoc.email,
                status: playerDoc.status,
                characters,
                inventory: inventory?.items || [],
                currency: playerDoc.currency || { gold: 0, diamonds: 0 },
                stats: playerDoc.stats || {
                    monstersKilled: 0,
                    questsCompleted: 0,
                    pvpWins: 0,
                    pvpLosses: 0,
                    itemsCollected: 0,
                    goldEarned: 0,
                    playtime: 0
                }
            };
            this.onlinePlayers.set(player.id, player);
            return player;
        }
        catch (error) {
            Logger_1.Logger.error('Authentication error:', error);
            return null;
        }
    }
    async createPlayer(username, password, email) {
        try {
            // Check if username exists
            const existing = await this.db.players.findOne({
                $or: [{ username }, { email }]
            });
            if (existing)
                return null;
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create initial inventory
            const inventoryResult = await this.db.inventory.insertOne({
                playerId: "temp", // Will update after player creation
                maxSlots: 20, // Starting inventory size
                items: [] // Empty inventory
            });
            // Create player document
            const result = await this.db.players.insertOne({
                username,
                password: hashedPassword,
                email,
                created: new Date(),
                lastLogin: new Date(),
                status: 'active',
                characters: [],
                inventory: {
                    id: inventoryResult.insertedId.toString(),
                    maxSlots: 20,
                    items: []
                },
                currency: {
                    gold: 1000, // Starting gold
                    diamonds: 5 // Starting diamonds
                },
                stats: {
                    monstersKilled: 0,
                    questsCompleted: 0,
                    pvpWins: 0,
                    pvpLosses: 0,
                    itemsCollected: 0,
                    goldEarned: 0,
                    playtime: 0
                },
                settings: {
                    language: 'ar', // Arabic default
                    notifications: true,
                    soundEnabled: true,
                    musicEnabled: true,
                    autoAttack: true
                }
            });
            // Update inventory with correct player ID
            await this.db.inventory.updateOne({ _id: inventoryResult.insertedId }, { $set: { playerId: result.insertedId.toString() } });
            // Return created player (without password)
            const player = {
                id: result.insertedId.toString(),
                username,
                email,
                status: 'active',
                characters: [],
                currency: { gold: 1000, diamonds: 5 },
                stats: {
                    monstersKilled: 0,
                    questsCompleted: 0,
                    pvpWins: 0,
                    pvpLosses: 0,
                    itemsCollected: 0,
                    goldEarned: 0,
                    playtime: 0
                }
            };
            return player;
        }
        catch (error) {
            Logger_1.Logger.error('Player creation error:', error);
            return null;
        }
    }
    async createCharacter(playerId, characterData) {
        try {
            // Validate character data
            if (!characterData.name || !characterData.class) {
                return null;
            }
            // Initialize character stats based on class
            const stats = this.getInitialStats(characterData.class);
            // Create character
            const result = await this.db.characters.insertOne({
                playerId,
                name: characterData.name,
                class: characterData.class,
                level: 1,
                experience: 0,
                stats,
                equipment: {},
                skills: this.getInitialSkills(characterData.class),
                position: {
                    x: 100,
                    y: 100,
                    map: 'starting_zone'
                }
            });
            // Add character to player's characters array
            await this.db.players.updateOne({ _id: playerId }, { $push: { characters: { $each: [result.insertedId.toString()] } } });
            // Return created character
            return await this.db.characters.findOne({ _id: result.insertedId });
        }
        catch (error) {
            Logger_1.Logger.error('Character creation error:', error);
            return null;
        }
    }
    getInitialStats(characterClass) {
        switch (characterClass) {
            case 'warrior':
                return {
                    health: 100,
                    attack: 15,
                    defense: 10,
                    speed: 5
                };
            case 'archer':
                return {
                    health: 80,
                    attack: 18,
                    defense: 5,
                    speed: 12
                };
            case 'mage':
                return {
                    health: 70,
                    attack: 20,
                    defense: 3,
                    speed: 8
                };
            default:
                return {
                    health: 90,
                    attack: 10,
                    defense: 10,
                    speed: 10
                };
        }
    }
    getInitialSkills(characterClass) {
        switch (characterClass) {
            case 'warrior':
                return ['basic_slash', 'defensive_stance'];
            case 'archer':
                return ['quick_shot', 'focus_aim'];
            case 'mage':
                return ['fire_bolt', 'frost_shield'];
            default:
                return ['basic_attack'];
        }
    }
    async updatePlayerPosition(playerId, position) {
        try {
            const player = this.onlinePlayers.get(playerId);
            if (!player)
                return false;
            // Find player's active character
            const character = await this.db.characters.findOne({
                playerId,
                _id: player.activeCharacterId
            });
            if (!character)
                return false;
            // Update character position
            await this.db.characters.updateOne({ _id: character._id }, { $set: {
                    "position.x": position.x,
                    "position.y": position.y,
                    "position.map": position.map || character.position.map
                } });
            return true;
        }
        catch (error) {
            Logger_1.Logger.error('Update position error:', error);
            return false;
        }
    }
    async getPlayerGuildId(playerId) {
        try {
            const player = this.onlinePlayers.get(playerId);
            if (player && player.guildId)
                return player.guildId;
            // If not in memory, check database
            const playerData = await this.db.players.findOne({ _id: playerId });
            return playerData?.guildId || null;
        }
        catch (error) {
            Logger_1.Logger.error('Get guild ID error:', error);
            return null;
        }
    }
    async getOnlinePlayers() {
        return Array.from(this.onlinePlayers.values());
    }
    async disconnectPlayer(playerId) {
        try {
            const player = this.onlinePlayers.get(playerId);
            if (player) {
                // Update player stats like playtime
                await this.db.players.updateOne({ _id: playerId }, { $inc: { "stats.playtime": player.sessionTime || 0 } });
                this.onlinePlayers.delete(playerId);
                this.playerSessions.delete(playerId);
            }
        }
        catch (error) {
            Logger_1.Logger.error('Disconnect player error:', error);
        }
    }
}
exports.PlayerManager = PlayerManager;
