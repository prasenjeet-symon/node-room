export interface SelectCache {
    nodeIdentifier: string;
    roomName: string;
    nodeName: string;
    id: string;
    paramObject: any;
    label: Label[];
    result: any;
}

export interface SelectCacheRequery {
    nodeIdentifier: string;
    roomName: string;
    nodeName: string;
    id: string;
    paramObject: any;
    label: Label[];
    result: any;
    latestResult: any;
}

export type NodeType = 'T' | 'C' | 'R' | 'U' | 'D';

// dao query config
export interface NodeConfig {
    mode: NodeType;
    id: string;
    labels: Label[];
}

// dao client run data
export interface NodeClientRunData {
    roomName: string;
    nodeName: string;
    paramObject: any;
}

// dao client run data result
export interface NodeClientRunDataResult {
    result: any;
}

// when type
export type WhenTypeFunction = (paramName: string) => (paramObject: any) => string | number;
export type WhenParamType = string | WhenTypeFunction;

export type When = (selfParamObject: any, mNodeParamObject: any, mNodeType: NodeType) => boolean;

export interface Label {
    label: string;
    when: When;
}

// bootstrap config
export interface NodeRoomConfig {
    rooms: any[];
    storage: NodeStorageClass;
    broker: NodeBrokerClass;
    clientKillTimeout: number;
}

export interface INodeStorage {
    add: (key: string, value: string, date?: Date) => Promise<void>;
    get: (key: string) => Promise<string | undefined>;
    remove: (key: string) => Promise<void>;
}

export interface INodeBroker {
    publish: (msg: string) => Promise<void>;
    subscribe: (callback: (msg: string) => void) => Promise<void>;
}

export type NodeStorageClass = new () => INodeStorage;
export type NodeBrokerClass = new () => INodeBroker;

export interface INodeBrokerMsg {
    clientInstanceUUID: string;
    roomName: string;
    nodeName: string;
    paramObject: any;
}
