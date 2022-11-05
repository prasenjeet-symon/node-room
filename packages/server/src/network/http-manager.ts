import { Request, Response } from 'express';
import { NodeRunner } from '../dao-runner/dao-runner';
import { NodeClientRunData, NodeConfig, NodeType } from '../main-interface';
import { RoomManager } from '../room';
import { HttpSelectManager } from '../select-managers/http-select-manager';
import { ServerManager } from '../server-manager';
import { generateHASH } from '../utils';
import { CentralCacheManager } from './central-cache-manager';

export class HttpCacheManager {
    private static _instance: HttpCacheManager;

    static getInstance(): HttpCacheManager {
        if (!HttpCacheManager._instance) HttpCacheManager._instance = new HttpCacheManager();
        return HttpCacheManager._instance;
    }

    private constructor() {}

    public async addNode(clientInstanceUUID: string, roomName: string, nodeName: string, paramObject: any, result: any) {
        const httpSelectManager = new HttpSelectManager();
        return await httpSelectManager.addNode(clientInstanceUUID, roomName, nodeName, paramObject, result);
    }

    public async getAffectedNodes(clientInstanceUUID: string, roomName: string, nodeName: string, paramObject: any, nodeType: NodeType) {
        const httpSelectManager = new HttpSelectManager();
        const affectedNodes = await httpSelectManager.getNode(clientInstanceUUID, roomName, nodeName, paramObject, nodeType);
        return affectedNodes;
    }

    public async updateAffectedNode(clientInstanceUUID: string, roomName: string, nodeName: string, paramObject: any, latestResult: any) {
        const httpSelectManager = new HttpSelectManager();
        await httpSelectManager.updateNode(clientInstanceUUID, roomName, nodeName, paramObject, latestResult);
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

    public removeHttpClient(httpClientHash: string) {
        this.httpClients.delete(httpClientHash);
    }

    public addHttpClient(httpClient: HttpClient) {
        this.httpClients.set(httpClient.getClientHASH(), httpClient);
    }
}
/**
 *
 *
 *
 */
export class HttpClient {
    private clientInstanceUUID!: string;
    private universalUniqueUserIdentifier!: string;
    private canCache: boolean = false;
    private nodeRunData!: NodeClientRunData;
    private httpClientHash!: string;
    private nodeConfig!: NodeConfig;

    constructor(private request: Request, private response: Response) {
        if (this.request.headers['universal-unique-user-identifier'] !== undefined && this.request.headers['client-instance-uuid'] !== undefined && this.request.headers['can-cache'] !== undefined) {
            this.clientInstanceUUID = this.request.headers['client-instance-uuid'] as string;
            this.canCache = this.request.headers['can-cache'] === '1' ? true : false;
            this.universalUniqueUserIdentifier = this.request.headers['universal-unique-user-identifier'] as string;

            this.nodeRunData = this.request.body as NodeClientRunData;

            this.httpClientHash = generateHASH([this.clientInstanceUUID, this.nodeRunData.roomName, this.nodeRunData.nodeName, JSON.stringify(this.nodeRunData.paramObject), (+new Date()).toString()]);
            this.nodeConfig = RoomManager.getInstance().getNodeConfig(this.nodeRunData.roomName, this.nodeRunData.nodeName);
            this.logRequest();

            try {
                this.runNode();
            } catch (error) {
                this.sendError('Error in running the node');
            }
        } else {
            this.sendError('Invalid Request');
        }
    }

    // run the node now
    public async runNode() {
        // Notify that client is alive
        ServerManager.getInstance()
            .getBroker()
            .publish(JSON.stringify({ type: 'clientAlive', data: this.clientInstanceUUID }));

        if (this.canCache && this.nodeConfig.mode === 'R') {
            const result = await CentralCacheManager.getInstance().query(this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject);
            
            const nodeIdentifier = await HttpCacheManager.getInstance().addNode(this.clientInstanceUUID, this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject, result);
            this.sendData({ nodeIdentifier, result });
        } else if (!this.canCache && this.nodeConfig.mode === 'R') {
            const result = await CentralCacheManager.getInstance().query(this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject);
            const nodeIdentifier = generateHASH([this.clientInstanceUUID, this.nodeRunData.roomName, this.nodeRunData.nodeName, JSON.stringify(this.nodeRunData.paramObject)]);
            this.sendData({ nodeIdentifier, result: result });
        } else {
            // modification node
            const nodeRunner = new NodeRunner(this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject);
            const result = await nodeRunner.run();

            if (ServerManager.getInstance().getConfig().strategy === 'cacheThenClient') {
                await CentralCacheManager.getInstance().modificationNodeReceived(this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject);
            } else {
                CentralCacheManager.getInstance().modificationNodeReceived(this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject);
            }

            ServerManager.getInstance()
                .getBroker()
                .publish(
                    JSON.stringify({
                        type: 'modificationNode',
                        data: {
                            clientInstanceUUID: this.clientInstanceUUID,
                            nodeName: this.nodeRunData.nodeName,
                            roomName: this.nodeRunData.roomName,
                            paramObject: this.nodeRunData.paramObject,
                        },
                    })
                );

            this.sendData({
                nodeIdentifier: undefined,
                result: result,
                delta: undefined,
            });
        }
    }

    public getClientHASH(): string {
        return this.httpClientHash;
    }

    public sendData(data: any) {
        this.response.send(data);
        HttpNetworkManager.getInstance().removeHttpClient(this.httpClientHash);
    }

    public sendError(error: any) {
        this.response.status(500).send(error);
        HttpNetworkManager.getInstance().removeHttpClient(this.httpClientHash);
    }

    public logRequest() {
        console.log(
            `[${this.clientInstanceUUID}] :: ${this.nodeRunData.roomName} - ${this.nodeRunData.nodeName} :: ${JSON.stringify(this.nodeRunData.paramObject)} :: ${
                this.nodeConfig.mode === 'R' ? this.canCache : false
            } :: ${this.nodeConfig.mode} :: ${new Date().toLocaleString()}`
        );
    }
}
