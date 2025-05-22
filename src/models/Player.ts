export class Player {
    id: string;
    username: string;
    email: string;
    status: string;
    characters: any[];
    activeCharacterId?: string;
    inventory: any[];
    currency: {
        gold: number;
        diamonds: number;
    };
    stats: {
        monstersKilled: number;
        questsCompleted: number;
        pvpWins: number;
        pvpLosses: number;
        itemsCollected: number;
        goldEarned: number;
        playtime: number;
    };
    settings: {
        language: string;
        notifications: boolean;
        soundEnabled: boolean;
        musicEnabled: boolean;
        autoAttack: boolean;
    };
    lastActivity: Date;
    sessionTime: number;
    
    constructor(data: any) {
        this.id = data._id?.toString() || data.id;
        this.username = data.username;
        this.email = data.email;
        this.status = data.status || 'active';
        this.characters = data.characters || [];
        this.activeCharacterId = data.activeCharacterId;
        this.inventory = data.inventory || [];
        this.currency = data.currency || { gold: 0, diamonds: 0 };
        this.stats = data.stats || {
            monstersKilled: 0,
            questsCompleted: 0,
            pvpWins: 0,
            pvpLosses: 0,
            itemsCollected: 0,
            goldEarned: 0,
            playtime: 0
        };
        this.settings = data.settings || {
            language: 'ar',
            notifications: true,
            soundEnabled: true,
            musicEnabled: true,
            autoAttack: true
        };
        this.lastActivity = new Date();
        this.sessionTime = 0;
    }

    updateActivity() {
        const now = new Date();
        const elapsed = now.getTime() - this.lastActivity.getTime();
        this.sessionTime += elapsed;
        this.lastActivity = now;
    }

    addGold(amount: number) {
        this.currency.gold += amount;
        this.stats.goldEarned += amount;
    }

    removeGold(amount: number): boolean {
        if (this.currency.gold >= amount) {
            this.currency.gold -= amount;
            return true;
        }
        return false;
    }

    addDiamonds(amount: number) {
        this.currency.diamonds += amount;
    }

    removeDiamonds(amount: number): boolean {
        if (this.currency.diamonds >= amount) {
            this.currency.diamonds -= amount;
            return true;
        }
        return false;
    }

    getCharacter(characterId?: string): any {
        const targetId = characterId || this.activeCharacterId;
        if (!targetId) return null;
        
        return this.characters.find(char => char._id.toString() === targetId);
    }

    setActiveCharacter(characterId: string) {
        this.activeCharacterId = characterId;
    }

    addItem(item: any) {
        // Find existing item stack
        const existingItem = this.inventory.find(i => 
            i.id === item.id && i.isStackable
        );

        if (existingItem) {
            existingItem.quantity += item.quantity || 1;
        } else {
            this.inventory.push({
                ...item,
                quantity: item.quantity || 1
            });
        }

        this.stats.itemsCollected++;
    }

    removeItem(itemId: string, quantity: number = 1): boolean {
        const itemIndex = this.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return false;

        const item = this.inventory[itemIndex];
        if (item.quantity < quantity) return false;

        item.quantity -= quantity;
        if (item.quantity <= 0) {
            this.inventory.splice(itemIndex, 1);
        }

        return true;
    }

    hasItem(itemId: string, quantity: number = 1): boolean {
        const item = this.inventory.find(i => i.id === itemId);
        return item && item.quantity >= quantity;
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            characters: this.characters,
            activeCharacterId: this.activeCharacterId,
            currency: this.currency,
            stats: this.stats
        };
    }
}