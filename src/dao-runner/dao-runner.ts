import { SelectCache, SelectCacheRequery } from '../main-interface';
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
            this.nodeInstance = new this.node();
            this.nodeInstance.param_object = this.paramObject;
            return await this.nodeInstance.fetch();
        } catch (error) {
            throw error;
        }
    }
}

export class NodeRequeryRunner {
    private requiredNodes: SelectCacheRequery[] = []; // result after requerying

    constructor(private cachedNodes: SelectCache[]) {}

    public async reQuery() {
        const promises = this.cachedNodes.map(async (cachedNode) => {
            const daoToRun = new NodeRunner(cachedNode.roomName, cachedNode.nodeName, cachedNode.paramObject);

            try {
                const result = await daoToRun.run();
                return {
                    nodeIdentifier: cachedNode.nodeIdentifier,
                    roomName: cachedNode.roomName,
                    nodeName: cachedNode.nodeName,
                    id: cachedNode.id,
                    paramObject: cachedNode.paramObject,
                    label: cachedNode.label,
                    result: cachedNode.result,
                    latestResult: result,
                };
            } catch (error) {
                return {
                    nodeIdentifier: cachedNode.nodeIdentifier,
                    roomName: cachedNode.roomName,
                    nodeName: cachedNode.nodeName,
                    id: cachedNode.id,
                    paramObject: cachedNode.paramObject,
                    label: cachedNode.label,
                    result: cachedNode.result,
                    latestResult: cachedNode.result,
                };
            }
        });

        this.requiredNodes = await Promise.all(promises);
        return this.requiredNodes;
    }
}
