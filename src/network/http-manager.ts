import { Request, Response } from 'express';
import { DaoRequeryRunner, DaoRunner } from '../dao-runner/dao-runner';
import { DaoClientRunData, DaoConfig } from '../main-interface';
import { HttpSelectManager } from '../select-managers/http-select-manager';
import { findDelta, generateHash, isDeltaEmpty } from '../utils';

export class HttpCacheManager {
    private httpCache: Map<string, Map<string, HttpSelectManager>> = new Map();
    static instance: HttpCacheManager;

    static getInstance(): HttpCacheManager {
        if (!HttpCacheManager.instance) {
            HttpCacheManager.instance = new HttpCacheManager();
        }
        return HttpCacheManager.instance;
    }

    constructor() {}

    // add http cache
    public addHttpCache(http_instance: string, database_name: string, dao_name: string, daoConfig: DaoConfig, param_object: any, result: any) {
        if (!this.httpCache.has(http_instance)) {
            this.httpCache.set(http_instance, new Map());
        }

        if (!this.httpCache.get(http_instance)?.has(database_name)) {
            this.httpCache.get(http_instance)?.set(database_name, new HttpSelectManager());
        }

        return this.httpCache.get(http_instance)?.get(database_name)?.addDao(database_name, dao_name, daoConfig.id, param_object, daoConfig.labels, result);
    }

    // get affected dao
    public getAffectedDao(http_instance: string, database_name: string, daoConfig: DaoConfig, param_object: any) {
        if (!this.httpCache.has(http_instance)) {
            return undefined;
        }

        if (!this.httpCache.get(http_instance)?.has(database_name)) {
            return undefined;
        }

        return this.httpCache
            .get(http_instance)
            ?.get(database_name)
            ?.getDao(
                daoConfig.labels.map((p) => p.label),
                param_object
            );
    }

    // update affected dao with latest result
    public updateAffectedDao(http_instance: string, database_name: string, daoIdentifier: string, latestResult: any) {
        if (!this.httpCache.has(http_instance)) {
            return undefined;
        }

        if (!this.httpCache.get(http_instance)?.has(database_name)) {
            return undefined;
        }

        return this.httpCache.get(http_instance)?.get(database_name)?.updateDao(daoIdentifier, latestResult);
    }
}

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

export class HttpClient {
    private clientInstanceUUID!: string;
    private canCache: boolean = false;
    private daoRunData: DaoClientRunData;
    private httpClientHash!: string;

    constructor(private request: Request, private response: Response) {
        if (this.request.headers['client-instance-uuid'] !== undefined && this.request.headers['can-cache'] !== undefined) {
            this.clientInstanceUUID = this.request.headers['client-instance-uuid'] as string;
            this.canCache = this.request.headers['can-cache'] === '1' ? true : false;
        }

        // extract the dao run data from body json
        this.daoRunData = this.request.body;
        this.httpClientHash = generateHash(this.clientInstanceUUID, this.daoRunData.databaseName, this.daoRunData.daoName, this.daoRunData.paramObject);
        try {
            this.runDao();
        } catch (error) {
            this.sendError(error);
        }
    }

    // run the dao
    public async runDao() {
        const daoRunner = new DaoRunner(this.daoRunData.databaseName, this.daoRunData.daoName, this.daoRunData.paramObject);
        const result = await daoRunner.run();
        const config = daoRunner.getDaoConfig();

        // if we can cache and dao mode is R ( read ) then cache the result
        if (this.canCache && config.mode === 'R') {
            // add the dao to the cache , because dao is cache able and mode is R
            const httpCacheManager = HttpCacheManager.getInstance();
            const daoIdentifier = httpCacheManager.addHttpCache(this.clientInstanceUUID, this.daoRunData.databaseName, this.daoRunData.daoName, config, this.daoRunData.paramObject, result);
            this.sendData({ daoIdentifier, result: result });
        } else if (!this.canCache && config.mode === 'R') {
            // incoming request is not cache able and dao mode is R ( read )
            // returning the result with undefined daoIdentifier to indicate that the result is not cache able
            this.sendData({ daoIdentifier: undefined, result: result });
        } else {
            // incoming dao was modification dao
            // get the affected dao due to changes
            const httpCacheManager = HttpCacheManager.getInstance();
            const affectedDao = httpCacheManager.getAffectedDao(this.clientInstanceUUID, this.daoRunData.databaseName, config, this.daoRunData.paramObject);
            // re-run all the affected dao
            if (affectedDao) {
                const daoRequeryRunner = new DaoRequeryRunner(affectedDao);
                const requeryResult = await daoRequeryRunner.reQuery();
                const withDelta = requeryResult
                    .map((p) => {
                        return { daoIdentifier: p.daoIdentifier, id: p.id, delta: findDelta(JSON.parse(p.result), p.latestResult, p.id) };
                    })
                    .filter((p) => !isDeltaEmpty(p.delta));

                requeryResult.forEach((p) => {
                    httpCacheManager.updateAffectedDao(this.clientInstanceUUID, this.daoRunData.databaseName, p.daoIdentifier, p.latestResult);
                });

                // we are sending the delta to the client
                // here daoIdentifier is undefined because the incoming dao is modification dao which is not cache able
                this.sendData({ daoIdentifier: undefined, result: result, delta: withDelta.length > 0 ? withDelta : undefined });
            } else {
                this.sendData({ daoIdentifier: undefined, result: result, delta: undefined });
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
        console.log(`[${this.clientInstanceUUID}] ${this.daoRunData.databaseName} ${this.daoRunData.daoName} ${this.daoRunData.paramObject}`);
    }
}
