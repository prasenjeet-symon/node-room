import { SelectCache, SelectCacheRequery } from '../main-interface';
import { CentralCacheManager } from '../network/central-cache-manager';
import { RoomManager } from '../room';
import { ServerManager } from '../server-manager';

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

    constructor(private cachedNodes: SelectCache[], private isCalledByCachedManger: boolean = false) {}

    public async reQuery() {
        const promises = this.cachedNodes.map(async (cachedNode) => {
            try {
                let result;

                if (ServerManager.getInstance().getConfig().strategy === 'cacheThenClient' && !this.isCalledByCachedManger) {
                    // cache is updated
                    // we can directly use cache
                    result = await CentralCacheManager.getInstance().query(cachedNode.roomName, cachedNode.nodeName, cachedNode.paramObject);
                } else {
                    const daoToRun = new NodeRunner(cachedNode.roomName, cachedNode.nodeName, cachedNode.paramObject);
                    result = await daoToRun.run();
                }

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
