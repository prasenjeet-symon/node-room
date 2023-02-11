import { EventEmitterManager, INodeBroker, INodeStorage } from '@noderoom/server';

export class DFStore implements INodeStorage {
    private store = new Map();

    constructor() {}

    async add(key: string, value: string) {
        this.store.set(key, value);
    }

    async get(key: string) {
        return this.store.get(key);
    }

    async remove(key: string) {
        this.store.delete(key);
    }
}

export class NodeBroker implements INodeBroker {
    constructor() {}

    public async publish(msg: string) {
        EventEmitterManager.getInstance().emit('msg', msg);
    }

    public async subscribe(callback: (msg: string) => void) {
        EventEmitterManager.getInstance().on('msg', callback);
    }
}
