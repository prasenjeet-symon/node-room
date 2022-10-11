import console from 'console';
import { Application, Request, Response } from 'express';
import { NodeRoomConfig } from './main-interface';
import { ClientInstanceManager } from './network/clear-client';
import { ClientRegistration } from './network/client-registration';
import { DownStreamClient, DownStreamManager } from './network/downstream-manager';
import { HttpCacheManager, HttpClient, HttpNetworkManager } from './network/http-manager';
import { RoomClient, RoomManager } from './room';
import { StorageManager } from './select-managers/http-select-manager';
import { ServerManager } from './server-manager';

export class NodeRoom {
    private static instance: NodeRoom;

    public static init(application: Application, config: NodeRoomConfig): NodeRoom {
        if (!NodeRoom.instance) NodeRoom.instance = new NodeRoom(application, config);
        return NodeRoom.instance;
    }

    private constructor(private application: Application, private config: NodeRoomConfig) {
        ServerManager.initInstance(this.config);
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
        this.application.post('/node-room-client-registration', (req: Request, res: Response) => {
            new ClientRegistration(req, res)
                .register()
                .then(() => {
                    res.send({ status: 'success' });
                })
                .catch((err) => {
                    res.send({ status: 'error' });
                });
        });

        // SSE connection
        // if the client instance do not exit on the distributed cache the do not connect to the downstream
        this.application.get('/node-room-sse/:clientInstanceUUID', async (req: Request, res: Response) => {
            if (!('clientInstanceUUID' in req.params)) {
                res.status(404).send('Not found');
                return;
            }

            const key = `client-${req.params.clientInstanceUUID}`;
            const clientInstanceUUID = await StorageManager.getInstance().storage.get(key);

            if (!clientInstanceUUID) {
                res.status(404).send('Not found');
                return;
            }

            DownStreamManager.getInstance().addDownStreamClient(new DownStreamClient(req, res));
        });

        // attach the post request handler
        this.application.post('/node-room', (req: Request, res: Response) => {
            const httpClient = new HttpClient(req, res);
            HttpNetworkManager.getInstance().addHttpClient(httpClient);
        });

        console.info('node-room is ready');
    }

    public app() {
        return this.application;
    }
}
