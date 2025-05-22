import { Logger } from './Logger';

interface GameTask {
    name: string;
    fn: () => void;
    interval: number;
    lastRun: number;
}

export class GameLoop {
    private tasks: Map<string, GameTask>;
    private isRunning: boolean;
    private tickInterval: number;
    private lastTick: number;

    constructor(tickRate: number = 60) {
        this.tasks = new Map();
        this.isRunning = false;
        this.tickInterval = 1000 / tickRate;
        this.lastTick = Date.now();
    }

    public addTask(name: string, fn: () => void, interval: number = 1000) {
        this.tasks.set(name, {
            name,
            fn,
            interval,
            lastRun: 0
        });
    }

    public removeTask(name: string) {
        this.tasks.delete(name);
    }

    public start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.loop();
        
        Logger.info('Game loop started');
    }

    public stop() {
        this.isRunning = false;
        Logger.info('Game loop stopped');
    }

    private loop() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTick;

        // Run tasks that are due
        this.tasks.forEach(task => {
            if (currentTime - task.lastRun >= task.interval) {
                try {
                    task.fn();
                    task.lastRun = currentTime;
                } catch (error) {
                    Logger.error(`Error in task ${task.name}:`, error);
                }
            }
        });

        this.lastTick = currentTime;

        // Schedule next tick
        const nextTickTime = Math.max(0, this.tickInterval - deltaTime);
        setTimeout(() => this.loop(), nextTickTime);
    }

    public getTaskCount(): number {
        return this.tasks.size;
    }

    public getTaskInfo(): { name: string, interval: number }[] {
        return Array.from(this.tasks.values()).map(task => ({
            name: task.name,
            interval: task.interval
        }));
    }

    public isTaskRunning(name: string): boolean {
        return this.tasks.has(name);
    }

    public updateTaskInterval(name: string, newInterval: number) {
        const task = this.tasks.get(name);
        if (task) {
            task.interval = newInterval;
        }
    }
}