import { INodeBroker, NodeRoomConfig } from './main-interface';
import { ClientInstanceManager } from './network/clear-client';
import { DownStreamManager } from './network/downstream-manager';

export class ServerManager {
    private static _instance: ServerManager;
    private nodeBroker: INodeBroker;

    public static initInstance(config: NodeRoomConfig): ServerManager {
        if (!ServerManager._instance) ServerManager._instance = new ServerManager(config);
        return ServerManager._instance;
    }

    private constructor(private readonly config: NodeRoomConfig) {
        this.nodeBroker = new config.broker();
        this.nodeBroker.subscribe((msg) => {
            const message = JSON.parse(msg) as any;
            const type = message.type;
            const data = message.data;

            if (type === 'modificationNode') {
                DownStreamManager.getInstance().modificationNodeReceived(data);
            } else if (type === 'clientDead') {
                DownStreamManager.getInstance().removeDownStreamClient(data);
            } else if (type === 'clientAlive') {
                ClientInstanceManager.getInstance()
                    .getClientInstance(data)
                    .then((m) => {
                        if (!m) return;
                        m.clientIsAlive();
                    });
            }
        });
    }

    public static getInstance() {
        return ServerManager._instance;
    }

    public getConfig() {
        return this.config;
    }

    public getBroker() {
        return this.nodeBroker;
    }
}
