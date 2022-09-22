import { createHash } from 'crypto';
import { INodeStorage, NodeConfig, NodeStorageClass, NodeType, SelectCache } from '../main-interface';
import { RoomManager } from '../room';
import { removeDuplicateValuesFromArray } from '../utils';

export class HttpSelectManager {
    constructor() {}

    public async addNode(httpInstanceUUID: string, roomName: string, nodeName: string, nodeConfig: NodeConfig, paramObject: any, result: any) {
        const labelStorageKey = httpInstanceUUID + roomName + 'labels';
        const paramStorageKey = httpInstanceUUID + roomName + 'params';
        const nodeIdentifier = this.generateNodeIdentifier( httpInstanceUUID, roomName, nodeName, paramObject);

        const previousParamObjectString = await StorageManager.getInstance().storage.get(paramStorageKey);
        const previousParamObjectArray: { nodeIdentifier: string; roomName: string; nodeName: string; paramObject: any }[] = previousParamObjectString ? JSON.parse(previousParamObjectString) : [];
        const previousParamObjectArrayNoCurrentNode = previousParamObjectArray.filter((previousParamObject) => previousParamObject.nodeIdentifier !== nodeIdentifier);

        await Promise.all([
            StorageManager.getInstance().storage.add(paramStorageKey, JSON.stringify([...previousParamObjectArrayNoCurrentNode, { nodeIdentifier, roomName, nodeName, paramObject }])),
            StorageManager.getInstance().storage.add(nodeIdentifier, JSON.stringify({ paramObject, roomName, nodeName, result }), new Date()),
        ]);

        const strictLabels = nodeConfig.labels.map((label) => label.label);

        const labelsHashMapString = await StorageManager.getInstance().storage.get(labelStorageKey);
        const labelsHashMap = labelsHashMapString ? JSON.parse(labelsHashMapString) : {};

        // add label and node identifier relation
        for (const label of strictLabels) {
            if (!labelsHashMap[label]) {
                labelsHashMap[label] = { [nodeIdentifier]: true };
            } else {
                labelsHashMap[label][nodeIdentifier] = true;
            }
        }

        await StorageManager.getInstance().storage.add(labelStorageKey, JSON.stringify(labelsHashMap));

        return nodeIdentifier;
    }

    public async getNode(httpInstanceUUID: string, roomName: string, nodeName: string, paramObject: any, nodeType: NodeType): Promise<SelectCache[]> {
        const modificationNodeConfig = RoomManager.getInstance().getNodeConfig(roomName, nodeName);
        const labelStorageKey = httpInstanceUUID + roomName + 'labels';

        const strictLabels = modificationNodeConfig.labels.map((label) => label.label);
        const labelsHashMapString = await StorageManager.getInstance().storage.get(labelStorageKey);
        const labelsHashMap = labelsHashMapString ? JSON.parse(labelsHashMapString) : {};

        const matchedLabelsWithNodeIdentifier: { label: string; nodeIdentifier: string }[] = [];

        for (const label of strictLabels) {
            if (labelsHashMap[label]) {
                for (const nodeIdentifier of Object.keys(labelsHashMap[label])) {
                    matchedLabelsWithNodeIdentifier.push({ label, nodeIdentifier });
                }
            }
        }

        const matchedLabelsWithNodeIdentifierUnique = removeDuplicateValuesFromArray(matchedLabelsWithNodeIdentifier, 'nodeIdentifier', 'label');

        const matchedNodeIdentifiersPromises = matchedLabelsWithNodeIdentifierUnique.map(async (matchedLabelWithNodeIdentifier) => {
            const paramStorageKey = httpInstanceUUID + roomName + 'params';
            const paramObjectString = await StorageManager.getInstance().storage.get(paramStorageKey);
            if (!paramObjectString) return null;

            const paramObjectArray: { nodeIdentifier: string; roomName: string; nodeName: string; paramObject: any }[] = paramObjectString ? JSON.parse(paramObjectString) : [];

            const paramObjectHashMap = paramObjectArray.find((paramObject) => paramObject.nodeIdentifier === matchedLabelWithNodeIdentifier.nodeIdentifier);
            if (!paramObjectHashMap) return null;

            const matchedRoomName = paramObjectHashMap.roomName;
            const matchedNodeName = paramObjectHashMap.nodeName;
            const matchedParamObject = paramObjectHashMap.paramObject;
            const matchedNodeConfig = RoomManager.getInstance().getNodeConfig(matchedRoomName, matchedNodeName);

            const isMatch = matchedNodeConfig.labels.filter((p) => p.label === matchedLabelWithNodeIdentifier.label).find((p) => p.when(matchedParamObject, paramObject, nodeType));
            if (isMatch) {
                return matchedLabelWithNodeIdentifier.nodeIdentifier;
            } else {
                return null;
            }
        });

        const matchedNodeIdentifiers = (await Promise.all(matchedNodeIdentifiersPromises)).filter((p) => p !== null) as string[];
        const matchedNodeIdentifiersUnique = Array.from(new Set(matchedNodeIdentifiers));

        const matchedNodeIdentifiersWithResultPromises = matchedNodeIdentifiersUnique.map(async (matchedNodeIdentifier) => {
            const resultString = await StorageManager.getInstance().storage.get(matchedNodeIdentifier);
            if (!resultString) {
                // TODO: We need to fetch the data from the server and add it to the storage
                return null;
            }

            const result = JSON.parse(resultString) as { paramObject: any; roomName: string; nodeName: string; result: any };
            const nodeConfig = RoomManager.getInstance().getNodeConfig(result.roomName, result.nodeName);

            return {
                id: nodeConfig.id,
                label: nodeConfig.labels,
                nodeIdentifier: matchedNodeIdentifier,
                nodeName: result.nodeName,
                roomName: result.roomName,
                result: result.result,
                paramObject: result.paramObject,
            } as SelectCache;
        });

        const matchedNodeIdentifiersWithResult = (await Promise.all(matchedNodeIdentifiersWithResultPromises)).filter((p) => p !== null) as SelectCache[];

        return matchedNodeIdentifiersWithResult;
    }

    // update the nodes with latest result
    public async updateNode(nodeIdentifier: string, roomName: string, nodeName: string, paramObject: any, result: any) {
        await StorageManager.getInstance().storage.add(nodeIdentifier, JSON.stringify({ paramObject, roomName, nodeName, result }), new Date());
    }
    /**
     * Generate the dao identifier
     */
    public generateNodeIdentifier(clientInstanceUUID: string, roomName: string, nodeName: string, paramObject: any): string {
        const hash = createHash('sha256');
        hash.update(clientInstanceUUID);
        hash.update(roomName);
        hash.update(nodeName);
        hash.update(JSON.stringify(paramObject));
        return hash.digest('hex');
    }
}

// storage manager abstract class
export class StorageManager {
    private static _instance: StorageManager;
    public storage: INodeStorage;

    static initInstance(storage: NodeStorageClass) {
        if (!StorageManager._instance) StorageManager._instance = new StorageManager(storage);
    }

    private constructor(storage: NodeStorageClass) {
        this.storage = new storage();
    }

    static getInstance(): StorageManager {
        return StorageManager._instance;
    }
}
