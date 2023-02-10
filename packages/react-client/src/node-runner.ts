import { fetchNode, NodeCallConfig, NodeCleaner } from '@noderoom/client';
import { signalResult } from './main-interface';

export class NodeRunnerManager {
    private static _instance: NodeRunnerManager;
    private nodeRunners: Map<string, NodeRunner> = new Map();

    public static getInstance() {
        if (!NodeRunnerManager._instance) NodeRunnerManager._instance = new NodeRunnerManager();
        return NodeRunnerManager._instance;
    }

    constructor() {}

    // add new runner
    public addNodeRunner(nodeRunner: NodeRunner) {
        this.nodeRunners.set(nodeRunner.getPaginationID(), nodeRunner);
    }

    // delete the node runner
    public deleteNodeRunner(paginationID: string) {
        this.nodeRunners.delete(paginationID);
    }

    // get the node runner
    public getNodeRunner(paginationID: string) {
        return this.nodeRunners.get(paginationID);
    }
}

export class NodeRunner {
    private subscription!: any;

    constructor(
        private setState: React.Dispatch<React.SetStateAction<signalResult>>,
        private paginationID: string,
        private nodeName: string,
        private paramObject: any,
        private config?: NodeCallConfig
    ) {
        try {
            this.getNode();
        } catch (error) {
            console.error(error);
        }
    }

    public getNode() {
        this.subscription = fetchNode(this.nodeName, this.paramObject, { ...this.config, paginationID: this.paginationID }).subscribe((data:any) => {
            this.setState({
                data: data.data,
                error: data.error,
                isLocal: data.isLocal,
                nodeRelationID: data.nodeRelationID,
                paginationID: data.paginationID,
                status: data.status,
            });
        });
    }

    // get paginationID
    public getPaginationID() {
        return this.paginationID;
    }

    // mark complete
    public markComplete() {
        if (this.subscription) this.subscription.unsubscribe();
        NodeCleaner.getInstance().clean(this.paginationID);
        NodeRunnerManager.getInstance().deleteNodeRunner(this.paginationID);
    }
}
