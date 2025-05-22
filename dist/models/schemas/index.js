"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseCollections = void 0;
class DatabaseCollections {
    constructor(db) {
        this.db = db;
    }
    // Collections
    get players() {
        return this.db.collection('players');
    }
    get characters() {
        return this.db.collection('characters');
    }
    get inventory() {
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
exports.DatabaseCollections = DatabaseCollections;
