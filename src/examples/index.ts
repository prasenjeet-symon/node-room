import cors from 'cors';
import express from 'express';
import { BootstrapNode } from '..';
import { INodeStorage } from '../main-interface';
import { TodoRoom } from './room';

const APP = express();
APP.use(cors({ origin: '*' }));
APP.use(express.json());

class DFStore implements INodeStorage {
    private store: Map<string, string>;

    constructor() {
        this.store = new Map();
    }

    async add(key: string, value: string, date?: Date) {
        this.store.set(key, value);
    }

    async get(key: string) {
        return this.store.get(key);
    }

    async remove(key: string) {
        this.store.delete(key);
    }
}

const NODE_APP = BootstrapNode.init(APP, { rooms: [TodoRoom], storage: DFStore, clientKillTimeout: 3600000 }).APP();

NODE_APP.listen('4000', () => {
    console.log('Server is running on port 4000');
});
