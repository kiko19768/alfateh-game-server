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
const database_1 = require("../config/database");
const schemas_1 = require("../models/schemas");
const Logger_1 = require("../utils/Logger");
const bcrypt = __importStar(require("bcrypt"));
async function main() {
    try {
        const command = process.argv[2];
        if (!command) {
            showHelp();
            return;
        }
        const dbConnection = database_1.DatabaseConnection.getInstance();
        const mongoDb = await dbConnection.getDatabase();
        const db = new schemas_1.DatabaseCollections(mongoDb);
        switch (command) {
            case 'init':
                await initializeDatabase(db);
                break;
            case 'create-admin':
                await createAdminUser(db);
                break;
            case 'reset':
                await resetDatabase(db);
                break;
            case 'status':
                await showStatus(db);
                break;
            default:
                console.log(`Unknown command: ${command}`);
                showHelp();
        }
        // Close connection
        await dbConnection.disconnect();
    }
    catch (error) {
        Logger_1.Logger.error('Database management error:', error);
    }
}
async function initializeDatabase(db) {
    try {
        Logger_1.Logger.info('Initializing database...');
        await db.initialize();
        // Check if admin user exists
        const adminExists = await db.players.findOne({ username: 'admin' });
        if (!adminExists) {
            // Create admin user
            await createAdminUser(db);
        }
        Logger_1.Logger.info('Database initialization completed');
    }
    catch (error) {
        Logger_1.Logger.error('Failed to initialize database:', error);
    }
}
async function createAdminUser(db) {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        // Create initial inventory for admin
        const inventoryResult = await db.inventory.insertOne({
            playerId: "admin_temp", // Will update after player creation
            maxSlots: 100,
            items: []
        });
        // Create the admin user
        const result = await db.players.insertOne({
            username: 'admin',
            password: hashedPassword,
            email: 'admin@alfateh.game',
            created: new Date(),
            lastLogin: new Date(),
            status: 'active',
            characters: [],
            inventory: {
                id: inventoryResult.insertedId.toString(),
                maxSlots: 100,
                items: []
            },
            currency: {
                gold: 999999,
                diamonds: 9999
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
                language: 'ar',
                notifications: true,
                soundEnabled: true,
                musicEnabled: true,
                autoAttack: true
            }
        });
        // Update inventory with correct player ID
        await db.inventory.updateOne({ _id: inventoryResult.insertedId }, { $set: { playerId: result.insertedId.toString() } });
        Logger_1.Logger.info('Admin user created with username: admin, password: admin123');
    }
    catch (error) {
        Logger_1.Logger.error('Failed to create admin user:', error);
    }
}
async function resetDatabase(db) {
    try {
        Logger_1.Logger.info('Resetting database...');
        // Drop collections
        await db.players.drop().catch(() => { });
        await db.characters.drop().catch(() => { });
        await db.inventory.drop().catch(() => { });
        // Reinitialize
        await db.initialize();
        await createAdminUser(db);
        Logger_1.Logger.info('Database has been reset');
    }
    catch (error) {
        Logger_1.Logger.error('Failed to reset database:', error);
    }
}
async function showStatus(db) {
    try {
        Logger_1.Logger.info('Database status:');
        const playerCount = await db.players.countDocuments();
        const characterCount = await db.characters.countDocuments();
        const inventoryCount = await db.inventory.countDocuments();
        console.log(`- Players: ${playerCount}`);
        console.log(`- Characters: ${characterCount}`);
        console.log(`- Inventories: ${inventoryCount}`);
    }
    catch (error) {
        Logger_1.Logger.error('Failed to get database status:', error);
    }
}
function showHelp() {
    console.log(`
Database Manager - Al-Fateh Game Server

Usage:
  npm run db [command]

Commands:
  init           Initialize database collections and indexes
  create-admin   Create admin user
  reset          Reset database (WARNING: This will delete all data)
  status         Show database status

Example:
  npm run db init
`);
}
// Run the CLI
main().catch(console.error);
