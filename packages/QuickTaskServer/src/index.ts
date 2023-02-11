import { NodeRoom } from '@noderoom/server';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express } from 'express';
import { TodoRoom } from './noderoom/todo-room/todo.room';
import { DFStore, NodeBroker } from './noderoom/utils';

dotenv.config();

const app: Express = express();
app.use(cors())
app.use(express.json());

const port = process.env.PORT;

const NODE_ROOM_APP = NodeRoom.init(app, { clientKillTimeout: 100000, rooms: [TodoRoom], storage: DFStore, broker: NodeBroker, strategy: 'cacheWithClient' }).app();

NODE_ROOM_APP.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
