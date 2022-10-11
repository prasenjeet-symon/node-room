import { NodeRequeryRunner, NodeRunner } from '../dao-runner/dao-runner';
import { RoomManager } from '../room';
import { CentralSelectManager } from '../select-managers/central-select-manager';
import { StorageManager } from '../select-managers/http-select-manager';
import { generateHASH } from '../utils';

export class CentralCacheManager {
    private static instance: CentralCacheManager;

    public static getInstance() {
        if (!CentralCacheManager.instance) CentralCacheManager.instance = new CentralCacheManager();
        return CentralCacheManager.instance;
    }

    constructor() {}

    public async query(roomName: string, nodeName: string, paramObject: any) {
        const nodeConfig = RoomManager.getInstance().getNodeConfig(roomName, nodeName);
        if (nodeConfig.mode !== 'R') return null;
        // read from cache
        const nodeIdentifier = generateHASH([roomName, nodeName, JSON.stringify(paramObject)]);
        const cacheResult = await StorageManager.getInstance().storage.get(nodeIdentifier);
        if (!cacheResult) {
            // there is no cache result , query directly
            const nodeRunner = new NodeRunner(roomName, nodeName, paramObject);
            const result = await nodeRunner.run();
            // add this select node to cache
            const centralSelectManager = new CentralSelectManager();
            centralSelectManager.addNode(roomName, nodeName, paramObject, result);
            return result;
        } else {
            const result = JSON.parse(cacheResult) as { paramObject: any; roomName: string; nodeName: string; result: any };
            return result.result;
        }
    }

    public async modificationNodeReceived(roomName: string, nodeName: string, paramObject: any) {
        const nodeConfig = RoomManager.getInstance().getNodeConfig(roomName, nodeName);
        const affectedNodes = await new CentralSelectManager().getNode(roomName, nodeName, paramObject, nodeConfig.mode);
        if (affectedNodes.length === 0) return;

        const nodeRequeryRunner = new NodeRequeryRunner(affectedNodes);
        const requeryResult = await nodeRequeryRunner.reQuery();

        return Promise.all(
            requeryResult.map(async (p) => {
                return new CentralSelectManager().updateNode(p.nodeIdentifier, p.roomName, p.nodeName, p.paramObject, p.latestResult);
            })
        );
    }
}
