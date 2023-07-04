
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
    public rooms: any[] = [];

    public static init(application: any, config: NodeRoomConfig): NodeRoom {
        if (!NodeRoom.instance) NodeRoom.instance = new NodeRoom(application, config);
        return NodeRoom.instance;
    }

    public static getInstance(): NodeRoom {
        return NodeRoom.instance;
    }

    private constructor(private application: any, private config: NodeRoomConfig) {
        ServerManager.initInstance(this.config);
        HttpCacheManager.getInstance();
        RoomManager.getInstance();
        HttpNetworkManager.getInstance();
        StorageManager.initInstance(config.storage);
        ClientInstanceManager.getInstance();
        this.rooms = config.rooms;

        for (const room of config.rooms) {
            const roomClient = new RoomClient(new room());
            RoomManager.getInstance().addRoom(roomClient.getRoomName(), roomClient);
        }

        // register the client
        this.application.post('/node-room-client-registration', (req: any, res: any) => {
            new ClientRegistration(req, res)
                .register()
                .then(() => {
                    res.send({ status: 'success' });
                })
                .catch(() => {
                    res.send({ status: 'error' });
                });
        });

        // SSE connection
        // if the client instance do not exit on the distributed cache the do not connect to the downstream
        this.application.get('/node-room-sse/:clientInstanceUUID', async (req: any, res: any) => {
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
        this.application.post('/node-room', (req: any, res: any) => {
            const httpClient = new HttpClient(req, res);
            HttpNetworkManager.getInstance().addHttpClient(httpClient);
        });

        console.info('node-room is ready');
    }

    public app() {
        return this.application;
    }
}
