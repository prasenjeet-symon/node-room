import { BehaviorSubject } from 'rxjs';
import { NodeRoomBootstrap } from '../bootstrap';
import { NodeResult, HttpSelect } from '../modal';
import { OfflineManager } from './offline-manager';

export class HttpDataEmitter {
    static _instance: HttpDataEmitter;
    private httpDataEmitter: Map<string, BehaviorSubject<NodeResult>> = new Map(); // paginationID --> BehaviorSubject

    private constructor() {}

    static getInstance() {
        if (!HttpDataEmitter._instance) {
            HttpDataEmitter._instance = new HttpDataEmitter();
        }
        return HttpDataEmitter._instance;
    }

    // get the data emitter
    public getNewSource(paginationID: string): BehaviorSubject<NodeResult> {
        if (!this.httpDataEmitter.has(paginationID)) {
            this.httpDataEmitter.set(paginationID, new BehaviorSubject<NodeResult>({ paginationID: paginationID, nodeRelationID: paginationID, data: null, error: null, isLocal: false, status: 'loading' }));
        }

        return this.httpDataEmitter.get(paginationID) as BehaviorSubject<NodeResult>;
    }

    public markComplete(paginationID: string) {
        if (this.httpDataEmitter.has(paginationID)) {
            this.httpDataEmitter.get(paginationID)?.complete();
            this.httpDataEmitter.delete(paginationID);
        }
    }

    public patchData(paginationID: string, data: Partial<NodeResult>) {
        if (this.httpDataEmitter.has(paginationID)) {
            const currentData = this.httpDataEmitter.get(paginationID)?.getValue();
            const newData = { ...currentData, ...data };
            this.httpDataEmitter.get(paginationID)?.next(JSON.parse(JSON.stringify(newData)));
        }
    }

    public emitData(paginationID: string, data: any, isLocal: boolean) {
        this.patchData(paginationID, { data: data, error: null, status: 'loaded', isLocal: isLocal });
    }

    public emitError(paginationID: string, error: any) {
        this.patchData(paginationID, { error: error, status: 'error' });
    }

    /**
     * Emit the data and complete the source
     */
    public emitDataComplete(paginationID: string, data: any, isLocal: boolean) {
        if (this.httpDataEmitter.has(paginationID)) {
            this.emitData(paginationID, data, isLocal);
            this.markComplete(paginationID);
        }
    }
    /**
     * Emit the error and complete the source
     */
    public emitErrorComplete(paginationID: string, error: any) {
        if (this.httpDataEmitter.has(paginationID)) {
            this.emitError(paginationID, error);
            this.markComplete(paginationID);
        }
    }
}

export class HttpSelectManager {
    static _instance: HttpSelectManager;
    private cachedNodes: Map<string, HttpSelect> = new Map();

    private constructor() {}

    public static getInstance(): HttpSelectManager {
        if (!HttpSelectManager._instance) {
            HttpSelectManager._instance = new HttpSelectManager();
        }
        return HttpSelectManager._instance;
    }

    public addSelect(nodeIdentifier: string, httpSelect: HttpSelect) {
        this.cachedNodes.set(nodeIdentifier, httpSelect);

        if (NodeRoomBootstrap.getInstance().getNodeRoomConfig().supportOffline) {
            OfflineManager.getInstance().setLocal(nodeIdentifier, httpSelect);
        }
    }

    public getSelect(nodeIdentifier: string): HttpSelect | undefined {
        return this.cachedNodes.get(nodeIdentifier);
    }
}
