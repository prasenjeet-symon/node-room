import { Application } from 'express';
import { DatabaseClient, DatabaseManager } from './database';
import { HttpCacheManager, HttpClient, HttpNetworkManager } from './network/http-manager';

export class BootstrapNode {
    private static _instance: BootstrapNode;
    private app: Application;

    public static init(app: Application, config: { databases: any[] }): BootstrapNode {
        if (!BootstrapNode._instance) {
            BootstrapNode._instance = new BootstrapNode(app, config);
        }
        return BootstrapNode._instance;
    }

    public APP() {
        return this.app;
    }

    private constructor(app: Application, config: { databases: any[] }) {
        this.app = app;
        HttpCacheManager.getInstance();
        DatabaseManager.getInstance();
        HttpNetworkManager.getInstance();

        for (const database of config.databases) {
            const databaseClient = new DatabaseClient(new database());
            DatabaseManager.getInstance().addDatabase(databaseClient.getDatabaseName(), databaseClient);
        }  

        // start listing http requests
        this.app.post('/node-room', (req, res) => {
            // new request
            const httpClient = new HttpClient(req, res);
            HttpNetworkManager.getInstance().addHttpClient(httpClient);
        });

        console.log('node-room is ready');
    }
}
