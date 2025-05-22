"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLoop = void 0;
const Logger_1 = require("./Logger");
class GameLoop {
    constructor(tickRate = 60) {
        this.tasks = new Map();
        this.isRunning = false;
        this.tickInterval = 1000 / tickRate;
        this.lastTick = Date.now();
    }
    addTask(name, fn, interval = 1000) {
        this.tasks.set(name, {
            name,
            fn,
            interval,
            lastRun: 0
        });
    }
    removeTask(name) {
        this.tasks.delete(name);
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.loop();
        Logger_1.Logger.info('Game loop started');
    }
    stop() {
        this.isRunning = false;
        Logger_1.Logger.info('Game loop stopped');
    }
    loop() {
        if (!this.isRunning)
            return;
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTick;
        // Run tasks that are due
        this.tasks.forEach(task => {
            if (currentTime - task.lastRun >= task.interval) {
                try {
                    task.fn();
                    task.lastRun = currentTime;
                }
                catch (error) {
                    Logger_1.Logger.error(`Error in task ${task.name}:`, error);
                }
            }
        });
        this.lastTick = currentTime;
        // Schedule next tick
        const nextTickTime = Math.max(0, this.tickInterval - deltaTime);
        setTimeout(() => this.loop(), nextTickTime);
    }
    getTaskCount() {
        return this.tasks.size;
    }
    getTaskInfo() {
        return Array.from(this.tasks.values()).map(task => ({
            name: task.name,
            interval: task.interval
        }));
    }
    isTaskRunning(name) {
        return this.tasks.has(name);
    }
    updateTaskInterval(name, newInterval) {
        const task = this.tasks.get(name);
        if (task) {
            task.interval = newInterval;
        }
    }
}
exports.GameLoop = GameLoop;
