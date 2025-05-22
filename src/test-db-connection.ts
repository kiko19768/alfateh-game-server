import { DatabaseConnection } from './config/database';
import { Logger } from './utils/Logger';

async function testDatabaseConnection() {
    try {
        Logger.info('Testing MongoDB connection...');
        
        const dbConnection = DatabaseConnection.getInstance();
        const client = await dbConnection.connect();
        
        // Ping the database
        await client.db("admin").command({ ping: 1 });
        Logger.info("Successfully connected to MongoDB Atlas!");
        
        // Get database and list collections
        const db = await dbConnection.getDatabase('alfatth_game');
        const collections = await db.listCollections().toArray();
        
        Logger.info(`Connected to database: alfatth_game`);
        Logger.info(`Available collections: ${collections.map(c => c.name).join(', ') || 'none'}`);
        
        // Close the connection
        await dbConnection.disconnect();
        Logger.info('Connection test completed successfully');
    } catch (error) {
        Logger.error('Failed to connect to MongoDB:', error);
    }
}

// Run the test
testDatabaseConnection().catch(console.error);