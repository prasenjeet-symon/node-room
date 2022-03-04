import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ChangeDetector } from './change-detector';
import { DatabaseClient, DatabaseManager } from './database';
import { ConnectMysql } from './MYSQL/connect-mysql';
import { HttpClient, HttpNetworkManager } from './network/http-manager';
import { SocketClient, SocketNetworkManager } from './network/socket-manager';
import { HttpSelectManager } from './select-managers/http-select-manager';
import { SocketSelectManager } from './select-managers/socket-select-manager';
import { createNewDatabase } from './utils';
require('dotenv').config();

console.log(process.env.MYSQL_HOST);
console.log(process.env.MYSQL_USER);
console.log(process.env.MYSQL_PASSWORD);

const app = express();
app.use(express.json());
const httpServer = createServer(app);

export class BootstrapNode {
    private static _instance: BootstrapNode;
    public get express(): express.Application {
        return app;
    }

    public static init(config: { databases: any[]; migrate?: boolean }): BootstrapNode {
        if (!BootstrapNode._instance) {
            BootstrapNode._instance = new BootstrapNode(config);
        }
        return BootstrapNode._instance;
    }

    private constructor(config: { databases: any[]; migrate?: boolean }) {
        (async () => {
            ConnectMysql.getInstance();

            for (const database of config.databases) {
                const database_instance = new database();
                await createNewDatabase(database_instance.getDatabaseName());
                await ConnectMysql.getInstance().connect(database_instance.getDatabaseName());

                const databaseClient = new DatabaseClient(database_instance, config.migrate);
                const databaseManager = DatabaseManager.getInstance();
                databaseManager.addDatabase(databaseClient.getDatabaseName(), databaseClient);
            }

            ChangeDetector.getInstance();
            DatabaseManager.getInstance();
            HttpNetworkManager.getInstance();
            SocketNetworkManager.getInstance();
            HttpSelectManager.getInstance();
            SocketSelectManager.getInstance();

            const io = new Server(httpServer, {});

            io.on('connection', (socket) => {
                console.log('a user connected');
                const socketNetworkManager = SocketNetworkManager.getInstance();
                const socketClient = new SocketClient(socket);
                socketNetworkManager.addSocketClient(socketClient.getSocketID(), socketClient);
            });

            app.post('/node_room', (req, res) => {
                const httpNetworkManager = HttpNetworkManager.getInstance();
                const httpClient = new HttpClient(req, res);
                httpNetworkManager.addHttpClient(httpClient);
            });
        })().then(()=> console.log('done'));
    }
}
