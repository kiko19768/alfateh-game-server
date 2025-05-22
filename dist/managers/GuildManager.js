"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildManager = void 0;
const Logger_1 = require("../utils/Logger");
class GuildManager {
    constructor(db) {
        this.db = db;
        this.activeGuilds = new Map();
    }
    async createGuild(guildData) {
        try {
            const result = await this.db.collection('guilds').insertOne({
                name: guildData.name,
                description: guildData.description,
                leader: guildData.leaderId,
                members: [{
                        id: guildData.leaderId,
                        rank: 'leader',
                        joinDate: new Date()
                    }],
                created: new Date(),
                level: 1,
                experience: 0,
                funds: 0
            });
            // Update player with guild ID
            await this.db.collection('players').updateOne({ _id: guildData.leaderId }, { $set: { guildId: result.insertedId.toString() } });
            return {
                id: result.insertedId.toString(),
                name: guildData.name,
                leader: guildData.leaderId
            };
        }
        catch (error) {
            Logger_1.Logger.error('Create guild error:', error);
            return null;
        }
    }
    async addMember(guildId, playerId) {
        try {
            // Check if player is already in a guild
            const player = await this.db.collection('players').findOne({ _id: playerId });
            if (player?.guildId) {
                return false;
            }
            // Add to guild members
            await this.db.collection('guilds').updateOne({ _id: guildId }, {
                $push: {
                    members: {
                        id: playerId,
                        rank: 'member',
                        joinDate: new Date()
                    }
                }
            });
            // Update player with guild ID
            await this.db.collection('players').updateOne({ _id: playerId }, { $set: { guildId: guildId } });
            return true;
        }
        catch (error) {
            Logger_1.Logger.error('Add guild member error:', error);
            return false;
        }
    }
    async removeMember(guildId, playerId) {
        try {
            // Remove from guild members
            await this.db.collection('guilds').updateOne({ _id: guildId }, { $pull: { members: { id: playerId } } });
            // Update player (remove guild ID)
            await this.db.collection('players').updateOne({ _id: playerId }, { $unset: { guildId: "" } });
            return true;
        }
        catch (error) {
            Logger_1.Logger.error('Remove guild member error:', error);
            return false;
        }
    }
}
exports.GuildManager = GuildManager;
