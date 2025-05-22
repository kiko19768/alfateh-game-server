"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./config/database");
const Logger_1 = require("./utils/Logger");
async function testDatabaseConnection() {
    try {
        Logger_1.Logger.info('Testing MongoDB connection...');
        const dbConnection = database_1.DatabaseConnection.getInstance();
        const client = await dbConnection.connect();
        // Ping the database
        await client.db("admin").command({ ping: 1 });
        Logger_1.Logger.info("Successfully connected to MongoDB Atlas!");
        // Get database and list collections
        const db = await dbConnection.getDatabase('alfatth_game');
        const collections = await db.listCollections().toArray();
        Logger_1.Logger.info(`Connected to database: alfatth_game`);
        Logger_1.Logger.info(`Available collections: ${collections.map(c => c.name).join(', ') || 'none'}`);
        // Close the connection
        await dbConnection.disconnect();
        Logger_1.Logger.info('Connection test completed successfully');
    }
    catch (error) {
        Logger_1.Logger.error('Failed to connect to MongoDB:', error);
    }
}
// Run the test
testDatabaseConnection().catch(console.error);
