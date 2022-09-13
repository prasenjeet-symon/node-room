import { createHash } from 'crypto';
import { INodeStorage, Label, NodeStorageClass, SelectCache } from '../main-interface';
import { removeDuplicateValuesFromArray } from '../utils';

export class HttpSelectManager {
    private strictLabels: Map<string, Set<string>> = new Map();
    private selectCache: Map<string, SelectCache> = new Map();

    constructor() {}
    /**
     *
     * @param nodeName : Name of the node
     * @param labels : Node labels
     * @param result : node result
     */
    public addNode(roomName: string, nodeName: string, id: string, paramObject: any, labels: Label[], result: any) {
        const nodeIdentifier = this.generateNodeIdentifier(roomName, nodeName, paramObject);
        // add the node to the select cache
        // since the node identifier is unique, we can use it as the key and map will replace the old value
        this.selectCache.set(nodeIdentifier, {
            nodeIdentifier,
            roomName,
            nodeName,
            id,
            paramObject,
            label: labels,
            result: null,
        });

        StorageManager.getInstance().storage.add(nodeIdentifier, JSON.stringify(result));

        const strictLabels = labels.map((label) => label.label);

        // add the strict labels
        for (const label of strictLabels) {
            if (!this.strictLabels.has(label)) {
                this.strictLabels.set(label, new Set());
            }

            this.strictLabels.get(label)?.add(nodeIdentifier);
        }

        return nodeIdentifier;
    }

    /**
     *
     * @param strictLabels : modification node labels
     * @param paramObject : modification node param object
     * @returns : affected nodes
     */
    public async getNode(strictLabels: string[], paramObject: any): Promise<SelectCache[]> {
        // get the node that match the strict labels
        const allStrictLabels: { label: string; nodeIdentifier: string }[] = [];

        for (const label of strictLabels) {
            if (this.strictLabels.has(label)) {
                const nodeIdentifiers = this.strictLabels.get(label);
                if (nodeIdentifiers) {
                    // set to an array
                    const nodeIdentifiersArray = Array.from(nodeIdentifiers);
                    allStrictLabels.push(...nodeIdentifiersArray.map((nodeIdentifier) => ({ label, nodeIdentifier })));
                }
            }
        }

        // convert to a set, we need only unique values
        const allStrictLabelsUnique = removeDuplicateValuesFromArray(allStrictLabels, 'nodeIdentifier', 'label');
        const finalStrictLabelsNodes: string[] = [];

        for (const nodeIdentifier of allStrictLabelsUnique) {
            const node = this.selectCache.get(nodeIdentifier.nodeIdentifier);
            if (node) {
                // we need to check the param label
                const isMatch = node.label.filter((p) => p.label === nodeIdentifier.label).find((label) => label.when(node.paramObject, paramObject));
                if (isMatch) {
                    finalStrictLabelsNodes.push(nodeIdentifier.nodeIdentifier);
                }
            }
        }

        const allAffectedNodes = Array.from(new Set(finalStrictLabelsNodes));

        const affectedNodesWithDataPromises = allAffectedNodes.map(async (nodeIdentifier) => {
            const node = this.selectCache.get(nodeIdentifier);
            if (node) {
                const storageData = await StorageManager.getInstance().storage.get(nodeIdentifier);
                return { ...node, result: storageData ? JSON.parse(storageData) : storageData };
            } else {
                return null;
            }
        });

        const allAffectedNodesFinal: SelectCache[] = (await Promise.all(affectedNodesWithDataPromises)).filter((p) => p !== null) as SelectCache[];

        return allAffectedNodesFinal;
    }

    // update the nodes with latest result
    public async updateNode(nodeIdentifier: string, result: any) {
        await StorageManager.getInstance().storage.add(nodeIdentifier, JSON.stringify(result));
    }
    /**
     * Generate the dao identifier
     */
    public generateNodeIdentifier(roomName: string, nodeName: string, paramObject: any): string {
        const hash = createHash('sha256');
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
