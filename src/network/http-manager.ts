import { Request, Response } from 'express';
import { NodeRequeryRunner, NodeRunner } from '../dao-runner/dao-runner';
import { NodeClientRunData, NodeConfig, NodeType } from '../main-interface';
import { RoomManager } from '../room';
import { HttpSelectManager } from '../select-managers/http-select-manager';
import { findDelta, generateHash, isDeltaEmpty } from '../utils';
import { RabbitMq } from './rabbit-mq';

export class HttpCacheManager {
    private static _instance: HttpCacheManager;

    static getInstance(): HttpCacheManager {
        if (!HttpCacheManager._instance) HttpCacheManager._instance = new HttpCacheManager();
        return HttpCacheManager._instance;
    }

    constructor() {}

    // add http cache
    public async addHttpCache(httpInstanceUUID: string, roomName: string, nodeName: string, nodeConfig: NodeConfig, paramObject: any, result: any) {
        const httpSelectManager = new HttpSelectManager();
        return await httpSelectManager.addNode(httpInstanceUUID, roomName, nodeName, nodeConfig, paramObject, result);
    }

    public async getAffectedNodes(httpInstanceUUID: string, roomName: string, nodeName: string, paramObject: any, nodeType: NodeType) {
        const httpSelectManager = new HttpSelectManager();
        const affectedNodes = await httpSelectManager.getNode(httpInstanceUUID, roomName, nodeName, paramObject, nodeType);
        return affectedNodes;
    }

    // update affected dao with latest result
    public async updateAffectedNode(nodeIdentifier: string, roomName: string, nodeName: string, paramObject: any, latestResult: any) {
        const httpSelectManager = new HttpSelectManager();
        await httpSelectManager.updateNode(nodeIdentifier, roomName, nodeName, paramObject, latestResult);
    }
}
/**
 *
 *
 *
 */
export class HttpNetworkManager {
    private httpClients: Map<string, HttpClient> = new Map();
    private static _instance: HttpNetworkManager;

    public static getInstance(): HttpNetworkManager {
        if (!HttpNetworkManager._instance) {
            HttpNetworkManager._instance = new HttpNetworkManager();
        }
        return HttpNetworkManager._instance;
    }

    private constructor() {}

    public removeHttpClient(httpClientUUID: string) {
        this.httpClients.delete(httpClientUUID);
    }

    public addHttpClient(httpClient: HttpClient) {
        this.httpClients.set(httpClient.httpClientUUID(), httpClient);
    }
}
/**
 *
 *
 *
 */
export class HttpClient {
    private clientInstanceUUID!: string;
    private canCache: boolean = false;
    private nodeRunData: NodeClientRunData;
    private httpClientHash!: string;
    private nodeConfig!: NodeConfig;

    constructor(private request: Request, private response: Response) {
        if (this.request.headers['client-instance-uuid'] !== undefined && this.request.headers['can-cache'] !== undefined) {
            this.clientInstanceUUID = this.request.headers['client-instance-uuid'] as string;
            this.canCache = this.request.headers['can-cache'] === '1' ? true : false;
        }

        this.nodeRunData = this.request.body;
        this.httpClientHash = generateHash(this.clientInstanceUUID, this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject);
        this.nodeConfig = RoomManager.getInstance().getNodeConfig(this.nodeRunData.roomName, this.nodeRunData.nodeName);
        this.logRequest();

        try {
            this.runNode();
        } catch (error) {
            this.sendError(error);
        }
    }

    // run the node now
    public async runNode() {
        const nodeRunner = new NodeRunner(this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject);
        const result = await nodeRunner.run();
        const config = nodeRunner.getNodeConfig();
        RabbitMq.getInstance().emitClientAlive(this.clientInstanceUUID);

        if (this.canCache && config.mode === 'R') {
            // add the dao to the cache
            const httpCacheManager = HttpCacheManager.getInstance();
            const nodeIdentifier = await httpCacheManager.addHttpCache(this.clientInstanceUUID, this.nodeRunData.roomName, this.nodeRunData.nodeName, config, this.nodeRunData.paramObject, result);

            this.sendData({ nodeIdentifier, result: result });
        } else if (!this.canCache && config.mode === 'R') {
            // incoming request is not cache able and dao mode is R ( read )
            // returning the result with undefined nodeIdentifier to indicate that the result is not cache able
            this.sendData({ nodeIdentifier: undefined, result: result });
        } else {
            RabbitMq.getInstance().emitToAllServerInstances({
                clientInstanceUUID: this.clientInstanceUUID,
                nodeName: this.nodeRunData.nodeName,
                roomName: this.nodeRunData.roomName,
                paramObject: this.nodeRunData.paramObject,
            });

            // this is modification request | modification node
            const httpCacheManager = HttpCacheManager.getInstance();
            const affectedNodes = await httpCacheManager.getAffectedNodes(this.clientInstanceUUID, this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject, config.mode);

            // re-run all the affected dao
            if (affectedNodes.length !== 0) {
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
                        await httpCacheManager.updateAffectedNode(p.nodeIdentifier, p.roomName, p.nodeName, p.paramObject, p.latestResult);
                    })
                );

                // we are sending the delta to the client
                // here nodeIdentifier is undefined because the incoming dao is modification dao which is not cache able
                this.sendData({
                    nodeIdentifier: undefined,
                    result: result,
                    delta: withDelta.length > 0 ? withDelta : undefined,
                });
            } else {
                this.sendData({
                    nodeIdentifier: undefined,
                    result: result,
                    delta: undefined,
                });
            }
        }
    }

    public httpClientUUID(): string {
        return this.httpClientHash;
    }

    // send data down the pipe
    public sendData(data: any) {
        this.response.send(data);
        // delete this client from the network manager
        HttpNetworkManager.getInstance().removeHttpClient(this.httpClientUUID());
    }

    // send the error
    public sendError(error: any) {
        this.response.status(500).send(error);
        // delete this client from the network manager
        HttpNetworkManager.getInstance().removeHttpClient(this.httpClientUUID());
    }

    // log the http request
    public logRequest() {
        console.log(
            `[${this.clientInstanceUUID}] :: ${this.nodeRunData.roomName} - ${this.nodeRunData.nodeName} :: ${JSON.stringify(this.nodeRunData.paramObject)} :: ${
                this.nodeConfig.mode === 'R' ? this.canCache : false
            } :: ${this.nodeConfig.mode} :: ${new Date().toLocaleString()}`
        );
    }
}
