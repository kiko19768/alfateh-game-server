import { DatabaseConnection } from '../config/database';
import { DatabaseCollections } from '../models/schemas';
import { Logger } from '../utils/Logger';
import * as bcrypt from 'bcrypt';

async function main() {
    try {
        const command = process.argv[2];
        
        if (!command) {
            showHelp();
            return;
        }

        const dbConnection = DatabaseConnection.getInstance();
        const mongoDb = await dbConnection.getDatabase();
        const db = new DatabaseCollections(mongoDb);
        
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
    } catch (error) {
        Logger.error('Database management error:', error);
    }
}

async function initializeDatabase(db: DatabaseCollections) {
    try {
        Logger.info('Initializing database...');
        await db.initialize();
        
        // Check if admin user exists
        const adminExists = await db.players.findOne({ username: 'admin' });
        if (!adminExists) {
            // Create admin user
            await createAdminUser(db);
        }
        
        Logger.info('Database initialization completed');
    } catch (error) {
        Logger.error('Failed to initialize database:', error);
    }
}

async function createAdminUser(db: DatabaseCollections) {
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
        await db.inventory.updateOne(
            { _id: inventoryResult.insertedId },
            { $set: { playerId: result.insertedId.toString() } }
        );
        
        Logger.info('Admin user created with username: admin, password: admin123');
    } catch (error) {
        Logger.error('Failed to create admin user:', error);
    }
}

async function resetDatabase(db: DatabaseCollections) {
    try {
        Logger.info('Resetting database...');
        
        // Drop collections
        await db.players.drop().catch(() => {});
        await db.characters.drop().catch(() => {});
        await db.inventory.drop().catch(() => {});
        
        // Reinitialize
        await db.initialize();
        await createAdminUser(db);
        
        Logger.info('Database has been reset');
    } catch (error) {
        Logger.error('Failed to reset database:', error);
    }
}

async function showStatus(db: DatabaseCollections) {
    try {
        Logger.info('Database status:');
        
        const playerCount = await db.players.countDocuments();
        const characterCount = await db.characters.countDocuments();
        const inventoryCount = await db.inventory.countDocuments();
        
        console.log(`- Players: ${playerCount}`);
        console.log(`- Characters: ${characterCount}`);
        console.log(`- Inventories: ${inventoryCount}`);
    } catch (error) {
        Logger.error('Failed to get database status:', error);
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