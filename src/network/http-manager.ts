import { Request, Response } from 'express';
import { NodeRequeryRunner, NodeRunner } from '../dao-runner/dao-runner';
import { NodeClientRunData, NodeConfig } from '../main-interface';
import { HttpSelectManager } from '../select-managers/http-select-manager';
import { findDelta, generateHash, isDeltaEmpty } from '../utils';

export class HttpCacheManager {
    private httpCache: Map<string, Map<string, HttpSelectManager>> = new Map();
    private static _instance: HttpCacheManager;

    static getInstance(): HttpCacheManager {
        if (!HttpCacheManager._instance) {
            HttpCacheManager._instance = new HttpCacheManager();
        }
        return HttpCacheManager._instance;
    }

    constructor() {}

    // add http cache
    public addHttpCache(http_instance: string, roomName: string, nodeName: string, nodeConfig: NodeConfig, param_object: any, result: any) {
        if (!this.httpCache.has(http_instance)) {
            this.httpCache.set(http_instance, new Map());
        }

        if (!this.httpCache.get(http_instance)?.has(roomName)) {
            this.httpCache.get(http_instance)?.set(roomName, new HttpSelectManager());
        }

        return this.httpCache.get(http_instance)?.get(roomName)?.addNode(roomName, nodeName, nodeConfig.id, param_object, nodeConfig.labels, result);
    }

    public getAffectedNodes(http_instance: string, roomName: string, nodeConfig: NodeConfig, param_object: any) {
        if (!this.httpCache.has(http_instance)) {
            return undefined;
        }

        if (!this.httpCache.get(http_instance)?.has(roomName)) {
            return undefined;
        }

        return this.httpCache
            .get(http_instance)
            ?.get(roomName)
            ?.getNode(
                nodeConfig.labels.map((p) => p.label),
                param_object
            );
    }

    // update affected dao with latest result
    public updateAffectedNode(http_instance: string, roomName: string, nodeIdentifier: string, latestResult: any) {
        if (!this.httpCache.has(http_instance)) {
            return undefined;
        }

        if (!this.httpCache.get(http_instance)?.has(roomName)) {
            return undefined;
        }

        return this.httpCache.get(http_instance)?.get(roomName)?.updateNode(nodeIdentifier, latestResult);
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
    private clientInstanceUUID!: string; // received from the client
    private canCache: boolean = false;
    private nodeRunData: NodeClientRunData;
    private httpClientHash!: string;

    constructor(private request: Request, private response: Response) {
        if (this.request.headers['client-instance-uuid'] !== undefined && this.request.headers['can-cache'] !== undefined) {
            this.clientInstanceUUID = this.request.headers['client-instance-uuid'] as string;
            this.canCache = this.request.headers['can-cache'] === '1' ? true : false;
        }

        this.nodeRunData = this.request.body;
        this.httpClientHash = generateHash(this.clientInstanceUUID, this.nodeRunData.roomName, this.nodeRunData.nodeName, this.nodeRunData.paramObject);
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

        // if we can cache and dao mode is R ( read ) then cache the result
        if (this.canCache && config.mode === 'R') {
            // add the dao to the cache , because dao is cacheable and mode is R
            const httpCacheManager = HttpCacheManager.getInstance();
            const nodeIdentifier = httpCacheManager.addHttpCache(
                this.clientInstanceUUID,
                this.nodeRunData.roomName,
                this.nodeRunData.nodeName,
                config,
                this.nodeRunData.paramObject,
                result
            );

            this.sendData({ nodeIdentifier, result: result });
        } else if (!this.canCache && config.mode === 'R') {
            // incoming request is not cache able and dao mode is R ( read )
            // returning the result with undefined nodeIdentifier to indicate that the result is not cache able
            this.sendData({ nodeIdentifier: undefined, result: result });
        } else {
            // incoming dao was modification dao
            // get the affected dao due to changes
            const httpCacheManager = HttpCacheManager.getInstance();
            const affectedNodes = httpCacheManager.getAffectedNodes(this.clientInstanceUUID, this.nodeRunData.roomName, config, this.nodeRunData.paramObject);

            // re-run all the affected dao
            if (affectedNodes) {
                const nodeRequeryRunner = new NodeRequeryRunner(affectedNodes);
                const requeryResult = await nodeRequeryRunner.reQuery();

                const withDelta = requeryResult
                    .map((p) => {
                        return {
                            nodeIdentifier: p.nodeIdentifier,
                            id: p.id,
                            delta: findDelta(JSON.parse(p.result), p.latestResult, p.id),
                        };
                    })
                    .filter((p) => !isDeltaEmpty(p.delta));

                requeryResult.forEach((p) => {
                    httpCacheManager.updateAffectedNode(this.clientInstanceUUID, this.nodeRunData.roomName, p.nodeIdentifier, p.latestResult);
                });

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
        console.log(`[${this.clientInstanceUUID}] ${this.nodeRunData.roomName} ${this.nodeRunData.nodeName} ${this.nodeRunData.paramObject}`);
    }
}
