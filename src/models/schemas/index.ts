import { Collection, Db } from 'mongodb';

export interface PlayerSchema {
    _id?: string;
    username: string;
    password: string;
    email: string;
    created: Date;
    lastLogin: Date;
    status: 'active' | 'banned' | 'deleted';
    characters: CharacterSchema[];
    inventory: InventorySchema;
    currency: {
        gold: number;
        diamonds: number;
    };
    stats: PlayerStatsSchema;
    settings: PlayerSettingsSchema;
}

export interface CharacterSchema {
    _id?: string;
    playerId: string;
    name: string;
    class: string;
    level: number;
    experience: number;
    stats: {
        health: number;
        attack: number;
        defense: number;
        speed: number;
    };
    equipment: {
        weapon?: string;
        armor?: string;
        accessory?: string;
    };
    skills: string[];
    position: {
        x: number;
        y: number;
        map: string;
    };
}

export interface InventorySchema {
    _id?: string;
    playerId: string;
    maxSlots: number;
    items: {
        id: string;
        quantity: number;
        slot: number;
    }[];
}

export interface PlayerStatsSchema {
    monstersKilled: number;
    questsCompleted: number;
    pvpWins: number;
    pvpLosses: number;
    itemsCollected: number;
    goldEarned: number;
    playtime: number;
}

export interface PlayerSettingsSchema {
    language: string;
    notifications: boolean;
    soundEnabled: boolean;
    musicEnabled: boolean;
    autoAttack: boolean;
}

export class DatabaseCollections {
    private db: Db;

    constructor(db: Db) {
        this.db = db;
    }

    // Collections
    get players(): Collection<PlayerSchema> {
        return this.db.collection('players');
    }

    get characters(): Collection<CharacterSchema> {
        return this.db.collection('characters');
    }

    get inventory(): Collection<InventorySchema> {
        return this.db.collection('inventory');
    }

    // Create indexes
    async createIndexes() {
        // Players indexes
        await this.players.createIndex({ username: 1 }, { unique: true });
        await this.players.createIndex({ email: 1 }, { unique: true });
        await this.players.createIndex({ status: 1 });

        // Characters indexes
        await this.characters.createIndex({ playerId: 1 });
        await this.characters.createIndex({ name: 1 });
        await this.characters.createIndex({ "position.map": 1 });

        // Inventory indexes
        await this.inventory.createIndex({ playerId: 1 }, { unique: true });
    }

    // Initialize collections with default data
    async initialize() {
        // Create collections if they don't exist
        const collections = await this.db.collections();
        const collectionNames = collections.map(c => c.collectionName);

        if (!collectionNames.includes('players')) {
            await this.db.createCollection('players');
        }

        if (!collectionNames.includes('characters')) {
            await this.db.createCollection('characters');
        }

        if (!collectionNames.includes('inventory')) {
            await this.db.createCollection('inventory');
        }

        // Create indexes
        await this.createIndexes();
    }
}