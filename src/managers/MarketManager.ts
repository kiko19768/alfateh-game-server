import { Db } from 'mongodb';
import { Logger } from '../utils/Logger';

export class MarketManager {
    private db: Db;
    private activeListings: Map<string, any>;

    constructor(db: Db) {
        this.db = db;
        this.activeListings = new Map();
    }

    async update(): Promise<void> {
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
        } catch (error) {
            Logger.error('Market update error:', error);
        }
    }

    private async expireListing(listingId: string): Promise<void> {
        try {
            // Update listing status
            await this.db.collection('market_listings').updateOne(
                { _id: listingId },
                { $set: { status: 'expired' } }
            );

            // Return item to seller
            const listing = await this.db.collection('market_listings').findOne({ _id: listingId });
            if (listing) {
                await this.returnItemToSeller(listing);
            }
        } catch (error) {
            Logger.error('Expire listing error:', error);
        }
    }

    private async returnItemToSeller(listing: any): Promise<void> {
        try {
            // Add item back to seller's inventory
            await this.db.collection('inventory').updateOne(
                { playerId: listing.sellerId },
                { $push: { items: listing.item } }
            );

            Logger.info(`Returned expired item to seller: ${listing.sellerId}`);
        } catch (error) {
            Logger.error('Return item error:', error);
        }
    }
}