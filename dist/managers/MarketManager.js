"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketManager = void 0;
const Logger_1 = require("../utils/Logger");
class MarketManager {
    constructor(db) {
        this.db = db;
        this.activeListings = new Map();
    }
    async update() {
        try {
            // Check for expired listings
            const now = new Date();
            const expiredListings = await this.db.collection('market_listings').find({
                status: 'active',
                expiryDate: { $lt: now }
            }).toArray();
            for (const listing of expiredListings) {
                await this.expireListing(listing._id);
            }
        }
        catch (error) {
            Logger_1.Logger.error('Market update error:', error);
        }
    }
    async expireListing(listingId) {
        try {
            // Update listing status
            await this.db.collection('market_listings').updateOne({ _id: listingId }, { $set: { status: 'expired' } });
            // Return item to seller
            const listing = await this.db.collection('market_listings').findOne({ _id: listingId });
            if (listing) {
                await this.returnItemToSeller(listing);
            }
        }
        catch (error) {
            Logger_1.Logger.error('Expire listing error:', error);
        }
    }
    async returnItemToSeller(listing) {
        try {
            // Add item back to seller's inventory
            await this.db.collection('inventory').updateOne({ playerId: listing.sellerId }, { $push: { items: listing.item } });
            Logger_1.Logger.info(`Returned expired item to seller: ${listing.sellerId}`);
        }
        catch (error) {
            Logger_1.Logger.error('Return item error:', error);
        }
    }
}
exports.MarketManager = MarketManager;
