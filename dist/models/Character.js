"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Character = void 0;
class Character {
    constructor(data) {
        this.id = data._id?.toString() || data.id;
        this.playerId = data.playerId;
        this.name = data.name;
        this.class = data.class;
        this.level = data.level || 1;
        this.experience = data.experience || 0;
        this.stats = {
            health: data.stats?.health || 100,
            maxHealth: data.stats?.maxHealth || data.stats?.health || 100,
            attack: data.stats?.attack || 10,
            defense: data.stats?.defense || 5,
            speed: data.stats?.speed || 5
        };
        this.equipment = data.equipment || {};
        this.skills = data.skills || [];
        this.position = data.position || { x: 0, y: 0, map: 'starting_zone' };
    }
    gainExperience(amount) {
        this.experience += amount;
        // Check for level up
        const leveledUp = this.checkLevelUp();
        return leveledUp;
    }
    checkLevelUp() {
        const requiredExp = this.getRequiredExperience();
        if (this.experience >= requiredExp) {
            this.level++;
            this.experience -= requiredExp;
            this.updateStats();
            return true;
        }
        return false;
    }
    getRequiredExperience() {
        // Experience formula: 100 * (level ^ 1.5)
        return Math.floor(100 * Math.pow(this.level, 1.5));
    }
    updateStats() {
        // Increase stats based on class and level
        switch (this.class) {
            case 'warrior':
                this.stats.maxHealth += 20;
                this.stats.attack += 3;
                this.stats.defense += 2;
                this.stats.speed += 1;
                break;
            case 'archer':
                this.stats.maxHealth += 15;
                this.stats.attack += 4;
                this.stats.defense += 1;
                this.stats.speed += 2;
                break;
            case 'mage':
                this.stats.maxHealth += 10;
                this.stats.attack += 5;
                this.stats.defense += 1;
                this.stats.speed += 1;
                break;
            default:
                this.stats.maxHealth += 15;
                this.stats.attack += 3;
                this.stats.defense += 1;
                this.stats.speed += 1;
        }
        // Heal to full on level up
        this.stats.health = this.stats.maxHealth;
    }
    equipItem(slot, itemId) {
        this.equipment[slot] = itemId;
    }
    unequipItem(slot) {
        delete this.equipment[slot];
    }
    addSkill(skillId) {
        if (!this.skills.includes(skillId)) {
            this.skills.push(skillId);
        }
    }
    removeSkill(skillId) {
        const index = this.skills.indexOf(skillId);
        if (index !== -1) {
            this.skills.splice(index, 1);
        }
    }
    move(x, y, map) {
        this.position.x = x;
        this.position.y = y;
        if (map) {
            this.position.map = map;
        }
    }
    heal(amount) {
        this.stats.health = Math.min(this.stats.health + amount, this.stats.maxHealth);
    }
    takeDamage(amount) {
        this.stats.health = Math.max(0, this.stats.health - amount);
        return this.stats.health <= 0;
    }
    isAlive() {
        return this.stats.health > 0;
    }
    toJSON() {
        return {
            id: this.id,
            playerId: this.playerId,
            name: this.name,
            class: this.class,
            level: this.level,
            experience: this.experience,
            stats: this.stats,
            equipment: this.equipment,
            skills: this.skills,
            position: this.position
        };
    }
}
exports.Character = Character;
