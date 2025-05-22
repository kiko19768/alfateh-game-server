import { DatabaseCollections } from '../models/schemas';
import { Logger } from '../utils/Logger';
import * as bcrypt from 'bcrypt';

export class PlayerManager {
    private db: DatabaseCollections;
    private onlinePlayers: Map<string, any>;
    private playerSessions: Map<string, string>; // playerId -> sessionId

    constructor(db: DatabaseCollections) {
        this.db = db;
        this.onlinePlayers = new Map();
        this.playerSessions = new Map();
    }

    public async authenticatePlayer(username: string, password: string): Promise<any | null> {
        try {
            const playerDoc = await this.db.players.findOne({ username });
            
            if (!playerDoc) return null;

            const isValid = await bcrypt.compare(password, playerDoc.password);
            if (!isValid) return null;

            // Update last login
            await this.db.players.updateOne(
                { _id: playerDoc._id },
                { $set: { lastLogin: new Date() } }
            );

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
        } catch (error) {
            Logger.error('Authentication error:', error);
            return null;
        }
    }

    public async createPlayer(username: string, password: string, email: string): Promise<any | null> {
        try {
            // Check if username exists
            const existing = await this.db.players.findOne({ 
                $or: [{ username }, { email }] 
            });

            if (existing) return null;

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
                    diamonds: 5  // Starting diamonds
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
            await this.db.inventory.updateOne(
                { _id: inventoryResult.insertedId },
                { $set: { playerId: result.insertedId.toString() } }
            );

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
        } catch (error) {
            Logger.error('Player creation error:', error);
            return null;
        }
    }

    public async createCharacter(playerId: string, characterData: any): Promise<any | null> {
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
            await this.db.players.updateOne(
                { _id: playerId },
                { $push: { characters: { $each: [result.insertedId.toString()] } } }
            );

            // Return created character
            return await this.db.characters.findOne({ _id: result.insertedId });
        } catch (error) {
            Logger.error('Character creation error:', error);
            return null;
        }
    }

    private getInitialStats(characterClass: string): any {
        switch(characterClass) {
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

    private getInitialSkills(characterClass: string): string[] {
        switch(characterClass) {
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

    public async updatePlayerPosition(playerId: string, position: any): Promise<boolean> {
        try {
        const player = this.onlinePlayers.get(playerId);
            if (!player) return false;

            // Find player's active character
            const character = await this.db.characters.findOne({ 
                playerId, 
                _id: player.activeCharacterId 
            });

            if (!character) return false;

            // Update character position
            await this.db.characters.updateOne(
                { _id: character._id },
                { $set: {
                    "position.x": position.x,
                    "position.y": position.y,
                    "position.map": position.map || character.position.map
                }}
            );

            return true;
        } catch (error) {
            Logger.error('Update position error:', error);
            return false;
        }
    }

    public async getPlayerGuildId(playerId: string): Promise<string | null> {
        try {
            const player = this.onlinePlayers.get(playerId);
            if (player && player.guildId) return player.guildId;

            // If not in memory, check database
            const playerData = await this.db.players.findOne({ _id: playerId });
            return playerData?.guildId || null;
        } catch (error) {
            Logger.error('Get guild ID error:', error);
            return null;
        }
    }

    public async getOnlinePlayers(): Promise<any[]> {
        return Array.from(this.onlinePlayers.values());
    }

    public async disconnectPlayer(playerId: string): Promise<void> {
        try {
            const player = this.onlinePlayers.get(playerId);
            if (player) {
                // Update player stats like playtime
                await this.db.players.updateOne(
                    { _id: playerId },
                    { $inc: { "stats.playtime": player.sessionTime || 0 } }
                );

                this.onlinePlayers.delete(playerId);
                this.playerSessions.delete(playerId);
}
        } catch (error) {
            Logger.error('Disconnect player error:', error);
        }
    }
}