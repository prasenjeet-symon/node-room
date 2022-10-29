import cors from 'cors';
import express from 'express';
import { NodeRoom } from '../bootstrap';
import { INodeBroker, INodeStorage } from '../main-interface';
import { EventEmitterManager } from '../network/event-manager';
import { TodoRoom } from './room';

const APP = express();
APP.use(cors({ origin: '*' }));
APP.use(express.json());

class DFStore implements INodeStorage {
    private store: Map<string, string>;

    constructor() {
        this.store = new Map();
    }

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

class NodeBroker implements INodeBroker {
    constructor() {}

    public async publish(msg: string) {
        EventEmitterManager.getInstance().emit('msg', msg);
    }

    public async subscribe(callback: (msg: string) => void) {
        EventEmitterManager.getInstance().on('msg', callback);
    }
}

const NODE_APP = NodeRoom.init(APP, { clientKillTimeout: 100000, rooms: [TodoRoom], storage: DFStore, broker: NodeBroker, strategy: 'cacheThenClient' }).app();

NODE_APP.listen('4000', () => {
    console.log('Server is running on port 4000');
});
