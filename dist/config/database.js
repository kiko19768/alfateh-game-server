"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const mongodb_1 = require("mongodb");
const Logger_1 = require("../utils/Logger");
class DatabaseConnection {
    constructor() {
        this.client = null;
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async connect() {
        if (this.client) {
            return this.client;
        }
        const connectionString = "mongodb+srv://meyoten4:1071998Kk@alfatth.fjmdexa.mongodb.net/?retryWrites=true&w=majority&appName=alfatth";
        try {
            this.client = new mongodb_1.MongoClient(connectionString, {
                serverApi: {
                    version: mongodb_1.ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });
            await this.client.connect();
            await this.client.db("admin").command({ ping: 1 });
            Logger_1.Logger.info("Successfully connected to MongoDB Atlas!");
            return this.client;
        }
        catch (error) {
            Logger_1.Logger.error("MongoDB Connection Error:", error);
            throw error;
        }
    }
    async getDatabase(dbName = 'alfatth_game') {
        if (!this.client) {
            await this.connect();
        }
        return this.client.db(dbName);
    }
    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            Logger_1.Logger.info("Disconnected from MongoDB");
        }
    }
}
exports.DatabaseConnection = DatabaseConnection;
