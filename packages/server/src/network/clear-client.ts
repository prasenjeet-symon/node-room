import { ServerManager } from '../server-manager';

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

// client instance is the browser connected to node room server
// that client instance should disconnect ( die ) after some time
// thats why we are receiving the dieAfter argument
// this will get created at the time of client registration
// this cannot be duplicated on the other server , so make sure to check the cache for the client registration key on distributed cache
// if the client registration key already exit then do not create this client instance
export class ClientInstance {
    private timeOutRef: any = null;

    constructor(public clientInstanceUUID: string, private dieAfter: number) {
        this.timeOutRef = setTimeout(() => {
            this.killClientInstance();
        }, dieAfter);
    }

    private killClientInstance() {
        // TODO : clean the cache database

        clearTimeout(this.timeOutRef);

        ServerManager.getInstance()
            .getBroker()
            .publish(JSON.stringify({ type: 'clientDead', data: this.clientInstanceUUID }));
        ClientInstanceManager.getInstance().removeClientInstance(this.clientInstanceUUID);
    }

    // if the client is fetching any node then we need to extend the death time
    // but if the client is not sending any node for long period of time this means client id dead and we need to free up the memory
    public clientIsAlive() {
        console.info('ClientInstance: ' + this.clientInstanceUUID + ' is alive');
        clearTimeout(this.timeOutRef);
        this.timeOutRef = setTimeout(() => {
            this.killClientInstance();
        }, this.dieAfter);
    }
}
