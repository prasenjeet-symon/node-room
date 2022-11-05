import { DeltaData, DeltaFinalResult, HttpSelect } from '../modal';
import { HttpPagination, NodeIdentifierRelations } from '../pagination/http-pagination';
import { findNewValueFromDelta } from '../utils';
import { HttpSelectManager } from './http-select-manager';

export class DeltaManager {
    private static _instance: DeltaManager;

    private constructor() {}

    public static getInstance(): DeltaManager {
        if (!DeltaManager._instance) {
            DeltaManager._instance = new DeltaManager();
        }
        return DeltaManager._instance;
    }

    private computeLatestResult(delta: DeltaData[]) {
        const httpSelectManager = HttpSelectManager.getInstance();

        return delta
            .map((p) => {
                const cachedNode = httpSelectManager.getSelect(p.nodeIdentifier);

                if (cachedNode) {
                    const newResult = findNewValueFromDelta(cachedNode.result, p.delta, p.id);
                    const newCachedNode: HttpSelect = {
                        ...cachedNode,
                        result: newResult,
                    };

                    // update cache with new result
                    httpSelectManager.addSelect(p.nodeIdentifier, newCachedNode);

                    return { nodeIdentifier: p.nodeIdentifier, result: newCachedNode };
                } else {
                    return null;
                }
            })
            .filter((p) => p !== null) as DeltaFinalResult[];
    }

    public settleDelta(incomingDelta: DeltaData[]) {
        const delta = this.computeLatestResult(incomingDelta);

        delta.forEach((delta) => {
            const paginationIDS: string[] = NodeIdentifierRelations.getInstance().getRelation(delta.nodeIdentifier);
            HttpPagination.getInstance().sendDataFromDelta(delta.result, delta.nodeIdentifier, paginationIDS);
        });
    }
}
