import { createHash } from 'crypto';
import { Label, SelectCache } from '../main-interface';
import { removeDuplicateValuesFromArray } from '../utils';

export class HttpSelectManager {
    private strictLabels: Map<string, Set<string>> = new Map();
    private selectCache: Map<string, SelectCache> = new Map();

    constructor() {}
    /**
     *
     * @param nodeName : Name of the dao to add
     * @param labels : Param label to add
     * @param result : dao query result
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
            result: JSON.stringify(result),
        });

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
     * Get the node from the cache
     *
     */
    public getNode(strictLabels: string[], paramObject: any): SelectCache[] {
        // get the node that match the strict labels
        const allStrictLabels: { label: string; nodeIdentifier: string }[] = [];

        for (const label of strictLabels) {
            if (this.strictLabels.has(label)) {
                const nodes = this.strictLabels.get(label);
                if (nodes) {
                    // set to an array
                    const daoArray = Array.from(nodes); // list of all nodeIdentifiers
                    allStrictLabels.push(...daoArray.map((nodeIdentifier) => ({ label, nodeIdentifier })));
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

        // array of all final dao identifiers
        const allNodes = Array.from(new Set(finalStrictLabelsNodes));

        // get the dao from the cache
        const allNodesFinal: SelectCache[] = [];
        for (const nodeIdentifier of allNodes) {
            const node = this.selectCache.get(nodeIdentifier);
            if (node) {
                allNodesFinal.push(node);
            }
        }

        // return the dao
        return allNodesFinal;
    }

    // update the nodes with latest result
    public updateNode(nodeIdentifier: string, result: any) {
        const node = this.selectCache.get(nodeIdentifier);
        if (node) {
            node.result = JSON.stringify(result);
        }
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
