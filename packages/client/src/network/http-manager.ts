import { NodeRoomBootstrap } from '../bootstrap';
import { HttpNetworkFetch, HttpSelect } from '../modal';
import { NodeCleaner } from '../node';
import { HttpPagination, NodeIdentifierRelations } from '../pagination/http-pagination';
import { HttpDataEmitter, HttpSelectManager } from '../select-manager/http-select-manager';
import { isNode, NodeJsConfig } from '../utils';

export class HttpNetworkManager {
    static _instance: HttpNetworkManager;

    private constructor() {}

    public static getInstance(): HttpNetworkManager {
        if (!HttpNetworkManager._instance) {
            HttpNetworkManager._instance = new HttpNetworkManager();
        }
        return HttpNetworkManager._instance;
    }

    public async fetch(httpCall: HttpNetworkFetch) {
        const nodeConfig = NodeRoomBootstrap.getInstance().getNodeRoomConfig();

        // if we are on the nodejs then we need to use the node-fetch
        // if we are on the browser then we need to use the fetch

        const runFetch = async () => {
            const isNodejs = isNode();
            if (isNodejs) {
                let fetch: any;
                try {
                    fetch = NodeJsConfig.instance.getConfig().nodeFetch;
                } catch (error) {
                    console.error('node-fetch is not installed. Please install node-fetch using "npm install node-fetch"');
                }

                return fetch(nodeConfig.host + '/node-room', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'can-cache': httpCall.canCache ? '1' : '0',
                        'client-instance-uuid': httpCall.clientInstanceUUID,
                        'universal-unique-user-identifier': httpCall.universalUniqueUserIdentifier,
                    },
                    body: JSON.stringify({ roomName: httpCall.roomName, nodeName: httpCall.nodeName, paramObject: httpCall.paramObject }),
                }).then((response: any) => response.json());
            } else {
                const header = new Headers();
                header.append('Content-Type', 'application/json');
                header.append('Accept', 'application/json');
                header.append('can-cache', httpCall.canCache ? '1' : '0');
                header.append('client-instance-uuid', httpCall.clientInstanceUUID);
                header.append('universal-unique-user-identifier', httpCall.universalUniqueUserIdentifier);

                return fetch(nodeConfig.host + '/node-room', {
                    method: 'POST',
                    headers: header,
                    body: JSON.stringify({ roomName: httpCall.roomName, nodeName: httpCall.nodeName, paramObject: httpCall.paramObject }),
                }).then((response) => response.json());
            }
        };

        const data = await runFetch();

        if (data.hasOwnProperty('nodeIdentifier')) {
            // whenever there is node identifier, it means that the node is query node
            const nodeIdentifier = data.nodeIdentifier;
            const result = data.result;

            const httpSelect: HttpSelect = {
                roomName: httpCall.roomName,
                nodeName: httpCall.nodeName,
                universalUniqueUserIdentifier: httpCall.universalUniqueUserIdentifier,
                paramObject: httpCall.paramObject,
                result: result,
            };

            HttpSelectManager.getInstance().addSelect(nodeIdentifier, httpSelect);
            HttpPagination.getInstance().sendData(httpSelect, nodeIdentifier, httpCall.paginationID);
            NodeIdentifierRelations.getInstance().pushRelation(nodeIdentifier, httpCall.paginationID);
        } else {
            // this is mutation node
            // emit the data to listener immediately
            // complete the stream , because modification is called only one time no further communication is required
            HttpDataEmitter.getInstance().emitDataComplete(httpCall.paginationID, data.result, false);
            NodeCleaner.getInstance().callHookForModificationNode(httpCall.paginationID);
        }
    }
}
