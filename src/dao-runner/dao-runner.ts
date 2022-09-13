import { NodeConfig, SelectCache, SelectCacheRequery } from '../main-interface';
import { RoomManager } from '../room';

export class NodeRunner {
    private node: any;
    private nodeInstance: any;

    constructor(private roomName: string, private nodeName: string, private paramObject: any) {
        // get the node from room
        this.node = RoomManager.getInstance().getNode(roomName, nodeName);
    }

    public async run() {
        try {
            const nodeToRun = new this.node();
            nodeToRun.param_object = this.paramObject;
            const result = await nodeToRun.fetch();
            this.nodeInstance = nodeToRun;
            return result;
        } catch (error) {
            throw error;
        }
    }

    public getNodeConfig(): NodeConfig {
        return this.nodeInstance.nodeConfig;
    }
}

export class NodeRequeryRunner {
    private requeriedNodes: SelectCacheRequery[] = []; // result after requerying

    constructor(private cachedNodes: SelectCache[]) {}

    public async reQuery() {
        for (const cachedNode of this.cachedNodes) {
            const daoToRun = new NodeRunner(cachedNode.roomName, cachedNode.nodeName, cachedNode.paramObject);

            try {
                const result = await daoToRun.run();

                this.requeriedNodes.push({
                    nodeIdentifier: cachedNode.nodeIdentifier,
                    roomName: cachedNode.roomName,
                    nodeName: cachedNode.nodeName,
                    id: cachedNode.id,
                    paramObject: cachedNode.paramObject,
                    label: cachedNode.label,
                    result: cachedNode.result,
                    latestResult: result,
                });
            } catch (error) {
                // do not throw error
                this.requeriedNodes.push({
                    nodeIdentifier: cachedNode.nodeIdentifier,
                    roomName: cachedNode.roomName,
                    nodeName: cachedNode.nodeName,
                    id: cachedNode.id,
                    paramObject: cachedNode.paramObject,
                    label: cachedNode.label,
                    result: cachedNode.result,
                    latestResult: cachedNode.result,
                });
            }
        }

        return this.requeriedNodes;
    }
}
