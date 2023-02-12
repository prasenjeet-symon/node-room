export interface HttpSelect {
    universalUniqueUserIdentifier: string;
    roomName: string;
    nodeName: string;
    paramObject: any;
    result: any;
}

export interface NodeCallConfig {
    roomName?: string; // Name of the room to which this node belong, if not provided, then the default room name will be used
    canCache?: boolean; // If true, then we will cache this node on the server and let you know when the data is updated, if not provided, then the default value will be used
    paginationID?: string; // used to configure the pagination , if not provided we will create for you
    supportOffline?: boolean; // weather to cache this node locally on your machine, if not provided then the default value will be used
    isGenesis?: boolean; // if true then pagination is active on this node, we will create a new data emitter for the pagination node
    waitForNodes?: string[]; // array of node relation ids to wait for before executing this node
}

export interface HttpNetworkFetch {
    clientInstanceUUID: string;
    universalUniqueUserIdentifier: string;
    paginationID: string;
    roomName: string;
    nodeName: string;
    paramObject: any;
    canCache: boolean;
    supportOffline: boolean;
}

export interface BootStrapConfig {
    host: string; // base url to node room server
    supportOffline: boolean; // can cache node locally
    defaultRoom: string; // give the default room name to use for every node
    canCache: boolean; // can cache the select node on the server or not
}

export type LOADING_STATUS = 'loading' | 'loaded' | 'error';

export interface NodeResult {
    status: LOADING_STATUS;
    error: any | null;
    data: any | null;
    isLocal: boolean;
    paginationID: string | null;
    nodeRelationID: string;
    isLoadingMore: boolean;
    isReachEnd: boolean;
}

export interface DeltaData {
    nodeIdentifier: string;
    delta: any;
    id: string;
}

export interface DeltaFinalResult {
    nodeIdentifier: string;
    result: HttpSelect;
}

export interface LocalStorage {
    nodeIdentifier: string;
    data: HttpSelect;
}

export interface PaginationData {
    nodeIdentifier: string;
    data: HttpSelect | undefined;
}
