import { Request, Response } from 'express';
import { StorageManager } from '../select-managers/http-select-manager';
import { ServerManager } from '../server-manager';
import { ClientInstance, ClientInstanceManager } from './clear-client';

export class ClientRegistration {
    constructor(private req: Request, private res: Response) {}

    // register
    public async register() {
        const data = this.req.body;
        const clientInstanceUUID = data.clientInstanceUUID;
        const key = `client-${clientInstanceUUID}`;
        await StorageManager.getInstance().storage.add(key, clientInstanceUUID);
        ClientInstanceManager.getInstance().addClientInstance(new ClientInstance(clientInstanceUUID, ServerManager.getInstance().clientKillTimeout));
    }
}
