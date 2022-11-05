import { nanoid } from 'nanoid';
import { NodeRoomBootstrap } from './bootstrap';
import { HttpNetworkFetch, NodeCallConfig } from './modal';
import { HttpNetworkManager } from './network/http-manager';
import { HttpPagination, NodeIdentifierRelations } from './pagination/http-pagination';
import { HttpDataEmitter } from './select-manager/http-select-manager';
import { OfflineManager } from './select-manager/offline-manager';

export function fetchNode(nodeName: string, paramObject: any, config?: NodeCallConfig) {
    return Node.getInstance().call(nodeName, paramObject, config);
}

export class Node {
    private static _instance: Node;

    private constructor() {}

    public static getInstance(): Node {
        if (!Node._instance) {
            Node._instance = new Node();
        }
        return Node._instance;
    }

    public call(nodeName: string, paramObject: any, config?: NodeCallConfig) {
        if (!nodeName) throw new Error('Node name is required');
        if (!paramObject) throw new Error('Param object is required');

        const nodeConfig = NodeRoomBootstrap.getInstance().getNodeRoomConfig();

        const httpCall: HttpNetworkFetch = {
            clientInstanceUUID: NodeRoomBootstrap.getInstance().getClientInstanceUUID(),
            universalUniqueUserIdentifier: NodeRoomBootstrap.getInstance().getUniversalUniqueUserIdentifier(),
            canCache: config ? ('canCache' in config ? (config.canCache as boolean) : nodeConfig.canCache) : nodeConfig.canCache,
            nodeName: nodeName,
            paramObject: paramObject,
            roomName: config ? ('roomName' in config ? (config.roomName as string) : nodeConfig.defaultRoom) : nodeConfig.defaultRoom,
            paginationID: config ? ('paginationID' in config ? (config.paginationID as string) : nanoid()) : nanoid(),
            supportOffline: config ? ('supportOffline' in config ? (config.supportOffline as boolean) : nodeConfig.supportOffline) : nodeConfig.supportOffline,
        };

        HttpDataEmitter.getInstance().getNewSource(httpCall.paginationID);
        OfflineManager.getInstance().fetch(httpCall);
        HttpNetworkManager.getInstance().fetch(httpCall);
        return HttpDataEmitter.getInstance().getNewSource(httpCall.paginationID).asObservable();
    }
}
/**
 * ********************************************************************************************************************
 * Node cleaner
 * ********************************************************************************************************************
 */
export class NodeCleaner {
    private static _instance: NodeCleaner;
    private hookForModificationNode!: (paginationID: string) => void;

    private constructor() {}

    public static getInstance(): NodeCleaner {
        if (!NodeCleaner._instance) {
            NodeCleaner._instance = new NodeCleaner();
        }
        return NodeCleaner._instance;
    }

    public clean(paginationID: string) {
        // incoming node is no longer required
        // clear the memory
        HttpPagination.getInstance().clearHistory(paginationID);
        HttpDataEmitter.getInstance().markComplete(paginationID);
        NodeIdentifierRelations.getInstance().removeRelation(paginationID);
    }

    // listen for modification node
    public listenForModificationNode(hook: (paginationID: string) => void) {
        this.hookForModificationNode = hook;
    }

    // call hook for modification node
    public callHookForModificationNode(paginationID: string) {
        if(this.hookForModificationNode){
            this.hookForModificationNode(paginationID);
        }
    }
}
