import { Request, Response } from 'express';
import { DatabaseManager } from '../database';
import { QueryType } from '../main-interface';
import { HttpSelectManager } from '../select-managers/http-select-manager';

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
    private daoRunData!: { dao_call_uuid: string; database_name: string; name: string; data: any };
    private canCache: boolean = false;

    constructor(private request: Request, private response: Response) {
        if (this.request.headers['client-instance-uuid'] !== undefined && this.request.headers['can-cache'] !== undefined && this.request.headers['dao-instance-uuid'] !== undefined) {
            this.clientInstanceUUID = this.request.headers['client-instance-uuid'] as string;
            this.canCache = this.request.headers['can-cache'] === 'true' ? true : false;
        }

        // extract the dao run data from body json
        this.daoRunData = this.request.body;
        console.log(this.daoRunData);

        if (!this.canCache) {
            const httpSelectManager = HttpSelectManager.getInstance();
            httpSelectManager.deleteSelect(this.clientInstanceUUID, this.daoRunData.database_name, this.daoRunData.name);
        }

        this.runDao();
    }

    // run the dao
    public async runDao() {
        // get the dao instance
        const database = DatabaseManager.getInstance();
        const daoClass = database.getDao(this.daoRunData.database_name, this.daoRunData.name);
        const daoIns = new daoClass();

        // set the dao ins config
        daoIns.dao_name = this.daoRunData.name;
        daoIns.requested_by = 'client';
        daoIns.runMode = 'http';
        daoIns.httpRunConfig = { cacheSelect: this.canCache, clientInstanceUUID: this.clientInstanceUUID };
        daoIns.socketRunConfig = undefined;
        daoIns.param_object = this.daoRunData.data;

        const result = await daoIns.fetch();
        const query_type: QueryType = daoIns.query_type;
        const mutation_tables: string[] = daoIns.mutationTables;
        const dao_type = query_type !== 'SELECT' ? 'M' : 'Q';
        const dao_call_uuid: string = this.daoRunData.dao_call_uuid;

        if (query_type !== 'SELECT') {
            // dao type is M
            const httpSelectManager = HttpSelectManager.getInstance();
            const delta = await httpSelectManager.getDelta(this.clientInstanceUUID, mutation_tables);
            this.sendData({ dao_call_uuid: dao_call_uuid, data: result, is_cached: false, dao_type: dao_type, delta: delta });
        } else {
            // dao type is Q
            this.sendData({ dao_call_uuid: dao_call_uuid, data: result, is_cached: this.canCache, dao_type: dao_type, delta: null });
        }
    }

    public httpClientUUID(): string {
        return `${this.daoRunData.database_name}-${this.daoRunData.name}`;
    }

    // send data down the pipe
    public sendData(data: any) {
        this.response.send(data);

        // delete this client from the network manager
        HttpNetworkManager.getInstance().removeHttpClient(this.httpClientUUID());
    }

    // log the http request
    public logRequest() {
        console.log(`${this.httpClientUUID()} - ${this.daoRunData.database_name} - ${this.daoRunData.name} - ${this.daoRunData.data}`);
    }
}
