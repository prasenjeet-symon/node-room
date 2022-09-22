import { RabbitMq } from './rabbit-mq';

export class ClientInstanceManager {
    private static _instance: ClientInstanceManager;
    private clients: Map<string, ClientInstance> = new Map();

    private constructor() {
        this.clients = new Map();
    }

    public static getInstance(): ClientInstanceManager {
        if (!ClientInstanceManager._instance) ClientInstanceManager._instance = new ClientInstanceManager();
        return ClientInstanceManager._instance;
    }

    // remove client instance
    public removeClientInstance(clientInstanceUUID: string) {
        this.clients.delete(clientInstanceUUID);
    }

    // add client instance
    public async addClientInstance(clientInstance: ClientInstance) {
        this.clients.set(clientInstance.clientInstanceUUID, clientInstance);
    }

    // get client instance
    public async getClientInstance(clientInstanceUUID: string) {
        return this.clients.get(clientInstanceUUID);
    }
}

export class ClientInstance {
    private timeOutRef: any = null;

    constructor(public clientInstanceUUID: string, private dieAfter: number) {
        this.timeOutRef = setTimeout(() => {
            this.killClientInstance();
        }, dieAfter);
    }

    private killClientInstance() {
        console.log('ClientInstance: ' + this.clientInstanceUUID + ' is dead');
        // TODO : clean the cache database

        clearTimeout(this.timeOutRef);
        RabbitMq.getInstance().emitClientDead(this.clientInstanceUUID);
        ClientInstanceManager.getInstance().removeClientInstance(this.clientInstanceUUID);
    }

    // client is alive
    public clientIsAlive() {
        console.log('ClientInstance: ' + this.clientInstanceUUID + ' is alive');
        clearTimeout(this.timeOutRef);
        this.timeOutRef = setTimeout(() => {
            this.killClientInstance();
        }, this.dieAfter);
    }
}
