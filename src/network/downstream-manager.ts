import { Request, Response } from 'express';
import { NodeRequeryRunner } from '../dao-runner/dao-runner';
import { INodeBrokerMsg } from '../main-interface';
import { RoomManager } from '../room';
import { findDelta, isDeltaEmpty } from '../utils';
import { HttpCacheManager } from './http-manager';

export class DownStreamManager {
    private static instance: DownStreamManager;
    private _downstreamNodes: { [key: string]: DownStreamClient } = {};

    private constructor() {}

    static getInstance(): DownStreamManager {
        if (!DownStreamManager.instance) {
            DownStreamManager.instance = new DownStreamManager();
        }
        return DownStreamManager.instance;
    }

    // add a downstream client
    public addDownStreamClient(downstreamClient: DownStreamClient) {
        this._downstreamNodes[downstreamClient.getClientInstanceUUID()] = downstreamClient;
    }

    // remove a downstream client
    public removeDownStreamClient(clientInstanceUUID: string) {
        delete this._downstreamNodes[clientInstanceUUID];
    }

    // get all downstream id
    private getDownStreamClients() {
        return Object.keys(this._downstreamNodes);
    }

    // get a downstream client
    public getDownStreamClient(clientInstanceUUID: string) {
        return this._downstreamNodes[clientInstanceUUID];
    }

    // modification node received
    public modificationNodeReceived(msg: INodeBrokerMsg) {
        const allClients = this.getDownStreamClients();
        const promises = allClients.map((clientInstanceUUID) => {
            return this.emitChangeToDownStreamClient(clientInstanceUUID, msg.roomName, msg.nodeName, msg.paramObject);
        });

        return Promise.all(promises);
    }

    private async emitChangeToDownStreamClient(clientInstanceUUID: string, roomName: string, nodeName: string, paramObject: any) {
        // this is modification request | modification node
        const nodeConfig = RoomManager.getInstance().getNodeConfig(roomName, nodeName);
        const httpCacheManager = HttpCacheManager.getInstance();
        const affectedNodes = await httpCacheManager.getAffectedNodes(clientInstanceUUID, roomName, nodeName, paramObject, nodeConfig.mode);
        if (affectedNodes.length === 0) return;

        const nodeRequeryRunner = new NodeRequeryRunner(affectedNodes);
        const requeryResult = await nodeRequeryRunner.reQuery();

        const withDelta = requeryResult
            .map((p) => {
                return {
                    nodeIdentifier: p.nodeIdentifier,
                    id: p.id,
                    delta: findDelta(p.result, p.latestResult, p.id),
                };
            })
            .filter((p) => !isDeltaEmpty(p.delta));

        Promise.all(
            requeryResult.map(async (p) => {
                return httpCacheManager.updateAffectedNode(p.nodeIdentifier, p.roomName, p.nodeName, p.paramObject, p.latestResult);
            })
        );

        // we are sending the delta to the client
        // here nodeIdentifier is undefined because the incoming dao is modification dao which is not cache able
        const downStreamData = {
            nodeIdentifier: undefined,
            result: undefined,
            delta: withDelta.length > 0 ? withDelta : undefined,
        };

        const downstream = this.getDownStreamClient(clientInstanceUUID);
        downstream.writeData(downStreamData);
    }
}

// down stream client
export class DownStreamClient {
    constructor(private req: Request, private res: Response) {
        // set headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
    }

    // get http client uuid
    getClientInstanceUUID() {
        return this.req.params.clientInstanceUUID;
    }

    // write data to sse
    public writeData(data: any) {
        this.res.write(`data: ${JSON.stringify(data)} \n\n`);
    }
}
