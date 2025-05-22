import { MongoClient, ServerApiVersion } from 'mongodb';
import { Logger } from '../utils/Logger';

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private client: MongoClient | null = null;
    
    private constructor() {}

    static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    async connect(): Promise<MongoClient> {
        if (this.client) {
            return this.client;
        }

        const connectionString = "mongodb+srv://meyoten4:1071998Kk@alfatth.fjmdexa.mongodb.net/?retryWrites=true&w=majority&appName=alfatth";

        try {
            this.client = new MongoClient(connectionString, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });

            await this.client.connect();
            await this.client.db("admin").command({ ping: 1 });
            Logger.info("Successfully connected to MongoDB Atlas!");
            
            return this.client;
        } catch (error) {
            Logger.error("MongoDB Connection Error:", error);
            throw error;
        }
    }

    async getDatabase(dbName: string = 'alfatth_game') {
        if (!this.client) {
            await this.connect();
        }
        return this.client!.db(dbName);
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            Logger.info("Disconnected from MongoDB");
        }
    }
}