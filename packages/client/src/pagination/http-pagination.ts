import { HttpSelect, PaginationData } from '../modal';
import { HttpDataEmitter, HttpSelectManager } from '../select-manager/http-select-manager';

export class HttpPagination {
    private static _instance: HttpPagination;
    private paginationHistory: Map<string, string[]> = new Map(); // paginationID: string, nodeIdentifier: string[];
    private constructor() {}

    public static getInstance(): HttpPagination {
        if (!HttpPagination._instance) {
            HttpPagination._instance = new HttpPagination();
        }
        return HttpPagination._instance;
    }

    private getHistory(paginationID: string) {
        if (!this.paginationHistory.has(paginationID)) {
            this.paginationHistory.set(paginationID, []);
        }

        return this.paginationHistory.get(paginationID);
    }

    public sendDataFromDelta(data: HttpSelect | undefined, nodeIdentifier: string, paginationIDS: string[]) {
        paginationIDS.forEach((paginationID) => {
            this.sendData(data, nodeIdentifier, paginationID);
        });
    }

    public sendData(data: HttpSelect | undefined, nodeIdentifier: string, paginationID: string, isLocal: boolean = false) {
        const history = this.getHistory(paginationID);

        if (history) {
            let indexOfNodeIdentifier = history.indexOf(nodeIdentifier);
            if (indexOfNodeIdentifier === -1) {
                // if not found, add it
                indexOfNodeIdentifier = history.length;
                history.push(nodeIdentifier);
                this.paginationHistory.set(paginationID, history);
            }

            const leftNodes = history.slice(0, indexOfNodeIdentifier);
            const rightNodes = indexOfNodeIdentifier === history.length - 1 ? [] : history.slice(indexOfNodeIdentifier + 1);
            const httpSelectManager = HttpSelectManager.getInstance();

            const paginationData: PaginationData[] = [];

            leftNodes.forEach((nodeIdentifier: string) => {
                paginationData.push({ nodeIdentifier, data: httpSelectManager.getSelect(nodeIdentifier) });
            });

            paginationData.push({ nodeIdentifier, data }); // center node

            rightNodes.forEach((nodeIdentifier: string) => {
                paginationData.push({ nodeIdentifier, data: httpSelectManager.getSelect(nodeIdentifier) });
            });

            // pagination means data is array;
            const finalData: any[] = [];

            paginationData.forEach((paginationData) => {
                const data = paginationData.data;
                if (data) {
                    // result is assumed to be array
                    finalData.push(...data.result);
                }
            });

            HttpDataEmitter.getInstance().emitData(paginationID, finalData, isLocal);
        }
    }

    // clear the history
    public clearHistory(paginationID: string) {
        this.paginationHistory.delete(paginationID);
    }
}
/**
 * this is for the delta manager
 * single nodeIdentifier can be related to multiple paginationID
 * when the data is fetched, it will be sent to all the paginationIDS
 */
export class NodeIdentifierRelations {
    private static _instance: NodeIdentifierRelations;
    private relation: Map<string, Set<string>> = new Map(); // nodeIdentifier: string, paginationID: string[]

    private constructor() {}

    public static getInstance(): NodeIdentifierRelations {
        if (!NodeIdentifierRelations._instance) {
            NodeIdentifierRelations._instance = new NodeIdentifierRelations();
        }
        return NodeIdentifierRelations._instance;
    }

    pushRelation(nodeIdentifier: string, paginationID: string) {
        const set = this.relation.get(nodeIdentifier);
        if (set) {
            set.add(paginationID);
        } else {
            const newSet = new Set<string>();
            newSet.add(paginationID);
            this.relation.set(nodeIdentifier, newSet);
        }
    }

    public getRelation(nodeIdentifier: string): string[] {
        const set = this.relation.get(nodeIdentifier);
        if (set) {
            return Array.from(set);
        } else {
            return [];
        }
    }

    // remove the relation
    public removeRelation(paginationID: string) {
        this.relation.forEach((set, nodeIdentifier) => {
            set.delete(paginationID);
            if (set.size === 0) {
                this.relation.delete(nodeIdentifier);
            }
        });
    }
}
