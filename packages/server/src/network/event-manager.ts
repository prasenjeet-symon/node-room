// nodejs event emitter

export class EventEmitterManager {
    private static _instance: EventEmitterManager;
    private eventEmitter: any;

    private constructor() {
        const EventEmitter = require('events');
        this.eventEmitter = new EventEmitter();
    }

    public static getInstance(): EventEmitterManager {
        if (!EventEmitterManager._instance) EventEmitterManager._instance = new EventEmitterManager();
        return EventEmitterManager._instance;
    }

    public emit(event: string, data: any) {
        this.eventEmitter.emit(event, data);
    }

    public on(event: string, callback: any) {
        this.eventEmitter.on(event, callback);
    }

    public removeListener(event: string, callback: any) {
        this.eventEmitter.removeListener(event, callback);
    }

    public removeAllListeners(event: string) {
        this.eventEmitter.removeAllListeners(event);
    }
}
