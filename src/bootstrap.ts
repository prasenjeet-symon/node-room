import console from 'console';
import { Application, Request, Response } from 'express';
import { BootstrapConfig } from './main-interface';
import { ClientInstanceManager } from './network/clear-client';
import { ClientRegistration } from './network/client-registration';
import { DownStreamClient, DownStreamManager } from './network/downstream-manager';
import { HttpCacheManager, HttpClient, HttpNetworkManager } from './network/http-manager';
import { RoomClient, RoomManager } from './room';
import { StorageManager } from './select-managers/http-select-manager';
import { ServerManager } from './server-manager';

export class BootstrapNode {
    private static _instance: BootstrapNode;
    private app: Application; // An Express application

    public static init(app: Application, config: BootstrapConfig): BootstrapNode {
        if (!BootstrapNode._instance) {
            BootstrapNode._instance = new BootstrapNode(app, config);
        }

        return BootstrapNode._instance;
    }

    public APP() {
        return this.app;
    }

    private constructor(app: Application, config: BootstrapConfig) {
        ServerManager.getInstance();
        ServerManager.getInstance().clientKillTimeout = config.clientKillTimeout;
        this.app = app;
        HttpCacheManager.getInstance();
        RoomManager.getInstance();
        HttpNetworkManager.getInstance();
        StorageManager.initInstance(config.storage);
        ClientInstanceManager.getInstance();

        for (const room of config.rooms) {
            const roomClient = new RoomClient(new room());
            RoomManager.getInstance().addRoom(roomClient.getRoomName(), roomClient);
        }

        // register the client
        this.app.post('/node-room-client-registration', (req: Request, res: Response) => {
            new ClientRegistration(req, res)
                .register()
                .then(() => {
                    res.send({ status: 'success' });
                })
                .catch((err) => {
                    console.error(err);
                    res.send({ status: 'error' });
                });
        });

        // SSE connection
        this.app.get('/node-room-sse/:clientInstanceUUID', async (req: Request, res: Response) => {
            // check if the client is registered
            const key = `client-${req.params.clientInstanceUUID}`;
            const clientInstanceUUID = await StorageManager.getInstance().storage.get(key);
            // verified the client
            if (clientInstanceUUID) {
                const downstreamClient = new DownStreamClient(req, res);
                DownStreamManager.getInstance().addDownStreamClient(downstreamClient);
            } else {
                res.status(404).send('Not found');
            }
        });

        // attach the post request handler
        this.app.post('/node-room', (req: Request, res: Response) => {
            const httpClient = new HttpClient(req, res);
            HttpNetworkManager.getInstance().addHttpClient(httpClient);
        });

        console.info('node-room is ready');
    }
}
