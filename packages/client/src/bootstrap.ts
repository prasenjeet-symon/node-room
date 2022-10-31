import { nanoid } from 'nanoid';
import { BootStrapConfig, DeltaData } from './modal';
import { DeltaManager } from './select-manager/delta-manager';
import { isNode, LocalStorageUniversal, NodeJsConfig } from './utils';

/**
 *  BootStrap node room with the configuration
 * @param config : configuration for the node room
 * @returns void
 */
export async function nodeRoomBootstrap(config: BootStrapConfig) {
    if (!config) throw new Error('NodeRoom config is required');
    if (!config.host) throw new Error('NodeRoom host is required');
    if (!config.defaultRoom) throw new Error('NodeRoom defaultRoom is required');
    if (!('supportOffline' in config)) throw new Error('NodeRoom supportOffline is required');
    if (!('canCache' in config)) throw new Error('NodeRoom canCache is required');

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
    private clientInstanceUUID: string = nanoid(); // each time we initialize the node room we need to create a new client instance
    private universalUniqueUserIdentifier!: string;
    private nodeRoomConfig!: BootStrapConfig;

    private constructor() {
        // set the clientInstanceUUID
        let clientInstanceUUID = LocalStorageUniversal.instance.getItem('clientInstanceUUID');
        if (!clientInstanceUUID) {
            clientInstanceUUID = nanoid();
            LocalStorageUniversal.instance.setItem('clientInstanceUUID', clientInstanceUUID);
        }

        // set the universalUniqueUserIdentifier
        let universalUniqueUserIdentifier = LocalStorageUniversal.instance.getItem('universalUniqueUserIdentifier');
        if (!universalUniqueUserIdentifier) {
            universalUniqueUserIdentifier = nanoid();
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

    // set the node room config
    public async setNodeRoomConfig(nodeRoomConfig: BootStrapConfig) {
        this.nodeRoomConfig = nodeRoomConfig;
        return this.registerClientInstance().then(() => {
            return this.registerSSE();
        });
    }

    // get the node room config
    public getNodeRoomConfig(): BootStrapConfig {
        return this.nodeRoomConfig;
    }

    // get the client instance uuid
    public getClientInstanceUUID(): string {
        return this.clientInstanceUUID;
    }

    // set the universal unique user identifier
    public async setUniversalUniqueUserIdentifier(universalUniqueUserIdentifier: string) {
        this.universalUniqueUserIdentifier = universalUniqueUserIdentifier;
    }

    // get universal unique user identifier
    public getUniversalUniqueUserIdentifier(): string {
        return this.universalUniqueUserIdentifier;
    }

    // register this node room client instance to the server
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

    // register the server sent event listener
    private registerSSE() {
        // if we are on the nodejs environment, we need to use the polyfill for the server sent event that is ('eventsource')

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
        };

        sse.onerror = (event: any) => {
           // console.log('sse error', event);
        };
        
    }
}
