import { NodeRoomBootstrap, simpleNodeUUID } from '@noderoom/client';

export class MutationLimiter {
    private static _instance: MutationLimiter;
    private nodeCallStack: Map<string, number> = new Map();

    private constructor() {}

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    // can call node
    public canCallNode(roomName: string | undefined, nodeName: string, paramObj: any, debounceTimeMs: number | null = null) {
        const roomNameFinal = roomName ? roomName : NodeRoomBootstrap.getInstance().getNodeRoomConfig().defaultRoom;

        const simpleUUID = simpleNodeUUID(roomNameFinal, nodeName, paramObj);
        if (!this.nodeCallStack.has(simpleUUID)) {
            // calling for the first time
            // add to stack
            this.nodeCallStack.set(simpleUUID, +new Date());
            return true;
        } else {
            const timestamp = this.nodeCallStack.get(simpleUUID) as number;
            const delta = +new Date() - timestamp;
            const debounceTime = debounceTimeMs !== null ? debounceTimeMs : NodeRoomBootstrap.getInstance().getNodeRoomConfig().mutationDebounceTimeMs;
            if (delta > debounceTime) {
                this.nodeCallStack.set(simpleUUID, +new Date());
                return true;
            } else {
                return false;
            }
        }
    }
}
