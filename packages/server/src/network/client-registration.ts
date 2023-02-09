import { StorageManager } from '../select-managers/http-select-manager';
import { ServerManager } from '../server-manager';
import { ClientInstance, ClientInstanceManager } from './clear-client';

export class ClientRegistration {
    constructor(private req: any, private res: any) {}

    // register
    public async register() {
        const data = this.req.body;
        const clientInstanceUUID = data.clientInstanceUUID; // this is unique per browser
        const universalUniqueUserIdentifier = data.universalUniqueUserIdentifier;
        const key = `client-${clientInstanceUUID}`;

        // if already exit then just return, no need to register the client
        const prevData = await StorageManager.getInstance().storage.get(key);
        if (prevData) return;

        // there is no client corresponding to key , register the new client
        await StorageManager.getInstance().storage.add(key, clientInstanceUUID);
        ClientInstanceManager.getInstance().addClientInstance(new ClientInstance(clientInstanceUUID, ServerManager.getInstance().getConfig().clientKillTimeout));
    }
}
