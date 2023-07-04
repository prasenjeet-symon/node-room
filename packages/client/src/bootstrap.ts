import { BootStrapConfig, DeltaData } from './modal';
import { NodeZen } from './nodezen';
import { DeltaManager } from './select-manager/delta-manager';
import { LocalStorageUniversal, NodeJsConfig, generateUUID, isNode } from './utils';
/**
 *  BootStrap node room with the configuration
 * @param config : configuration for the node room
 * @returns void
 */
export async function nodeRoomBootstrap(config: BootStrapConfig) {
    if (!config) throw new Error('NodeRoom config is required');
    if (!(config && 'host' in config)) throw new Error('NodeRoom host is required');
    if (!(config && 'defaultRoom' in config)) throw new Error('NodeRoom defaultRoom is required');
    if (!(config && 'supportOffline' in config)) throw new Error('NodeRoom supportOffline is required');
    if (!(config && 'canCache' in config)) throw new Error('NodeRoom canCache is required');

    await NodeRoomBootstrap.getInstance().setNodeRoomConfig(config);
    return;
}

/**
 * Set the universal unique user identifier, this is used to identify the user across the different devices and help us in intelligent caching of the node
 *
 * If not set, we will generate a random id for the user
 */
export function setUniversalUniqueUserIdentifier(universalUniqueUserIdentifier: string) {
    if (!universalUniqueUserIdentifier) throw new Error('universalUniqueUserIdentifier is required');
    if (universalUniqueUserIdentifier.length < 10) throw new Error('universalUniqueUserIdentifier is too short');
    return NodeRoomBootstrap.getInstance().setUniversalUniqueUserIdentifier(universalUniqueUserIdentifier);
}

export class NodeRoomBootstrap {
    private static _instance: NodeRoomBootstrap;
    private clientInstanceUUID: string = generateUUID();
    private universalUniqueUserIdentifier!: string;
    private nodeRoomConfig!: BootStrapConfig;

    private constructor() {
        // set the clientInstanceUUID
        let clientInstanceUUID = LocalStorageUniversal.instance.getItem('clientInstanceUUID');
        if (!clientInstanceUUID) {
            clientInstanceUUID = generateUUID();
            LocalStorageUniversal.instance.setItem('clientInstanceUUID', clientInstanceUUID);
        }

        // set the universalUniqueUserIdentifier
        let universalUniqueUserIdentifier = LocalStorageUniversal.instance.getItem('universalUniqueUserIdentifier');
        if (!universalUniqueUserIdentifier) {
            universalUniqueUserIdentifier = generateUUID();
            LocalStorageUniversal.instance.setItem('universalUniqueUserIdentifier', universalUniqueUserIdentifier);
        }

        this.clientInstanceUUID = clientInstanceUUID;
        this.universalUniqueUserIdentifier = universalUniqueUserIdentifier;
    }

    public static getInstance(): NodeRoomBootstrap {
        if (!NodeRoomBootstrap._instance) {
            NodeRoomBootstrap._instance = new NodeRoomBootstrap();
        }
        return NodeRoomBootstrap._instance;
    }

    /** Set the NodeRoom configuration */
    public async setNodeRoomConfig(nodeRoomConfig: BootStrapConfig) {
        this.nodeRoomConfig = nodeRoomConfig;
        return this.registerClientInstance().then(() => {
            return this.registerSSE();
        });
    }

    /** Get the NodeRoom configuration object */
    public getNodeRoomConfig(): BootStrapConfig {
        return this.nodeRoomConfig;
    }

    /** Get the client instance UUID, that is usually unique for for the given browser instance */
    public getClientInstanceUUID(): string {
        return this.clientInstanceUUID;
    }

    /** Set the universal unique user identifier, that is used to identify the user on different machine, useful for nodeRoom analytics */
    public async setUniversalUniqueUserIdentifier(universalUniqueUserIdentifier: string) {
        // TODO : We may need to sync with server in future, but for now it is ok
        // Currently all the node call after new universalUniqueUserIdentifier assignment will use new universalUniqueUserIdentifier value
        this.universalUniqueUserIdentifier = universalUniqueUserIdentifier;
    }

    /** get universal unique user identifier */
    public getUniversalUniqueUserIdentifier(): string {
        return this.universalUniqueUserIdentifier;
    }

    /** register this node room client instance to the server */
    private async registerClientInstance() {
        const body = {
            clientInstanceUUID: this.clientInstanceUUID,
            universalUniqueUserIdentifier: this.universalUniqueUserIdentifier,
        };

        const runFetch = async () => {
            const isNodejs = isNode();
            if (isNodejs) {
                let fetch: any;
                try {
                    fetch = NodeJsConfig.instance.getConfig().nodeFetch;
                } catch (error) {
                    console.error('node-fetch is not installed. Please install node-fetch using "npm install node-fetch"');
                }

                return fetch(this.nodeRoomConfig.host + '/node-room-client-registration', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }).then((response: any) => response.json());
            } else {
                const header = new Headers();
                header.append('Content-Type', 'application/json');

                return fetch(this.nodeRoomConfig.host + '/node-room-client-registration', {
                    method: 'POST',
                    headers: header,
                    body: JSON.stringify(body),
                }).then((response) => response.json());
            }
        };

        await runFetch();
    }

    /** register the server sent event listener */
    private registerSSE() {
        let EventSourceFinal: any;

        const assignEventSource = () => {
            const isNodejs = isNode();
            if (isNodejs) {
                try {
                    EventSourceFinal = NodeJsConfig.instance.getConfig().nodeEventSource;
                } catch (error) {
                    console.error('eventsource is not installed. Please install eventsource using "npm install eventsource"');
                }
            } else {
                EventSourceFinal = EventSource;
            }
        };

        assignEventSource();

        const sse = new EventSourceFinal(this.nodeRoomConfig.host + `/node-room-sse/${this.clientInstanceUUID}`);

        sse.onmessage = (event: any) => {
            const data = JSON.parse(event.data);
            if (data.hasOwnProperty('delta')) {
                const delta: DeltaData[] = data.delta;
                DeltaManager.getInstance().settleDelta(delta);
            }

            // listen for the nodeRoomTypes
            if (data.hasOwnProperty('nodeRoomType')) {
                new NodeZen(data.nodeRoomType);
            }
        };

        sse.onerror = (event: any) => {
            console.log('sse error', event);
        };
    }
}
