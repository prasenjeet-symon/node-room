import { fetchNode, NodeCallConfig } from '@noderoom/client';
import { useEffect, useMemo, useState } from 'react';
import { generateUUID, signalResult } from './main-interface';
import { NodeRunner, NodeRunnerManager } from './node-runner';
export { bootstrapNodeRoom } from './bootstrap';

export function getNode(nodeName: string, paramObject: any, config?: NodeCallConfig) {
    // node name is required
    if (!nodeName) throw new Error('Node name is required');
    // param object is required or empty object
    if (!paramObject) paramObject = {};

    const paginationID = config ? ('paginationID' in config ? (config.paginationID as string) : generateUUID()) : generateUUID();
    const [node, setNode] = useState<signalResult>({ data: null, error: null, isLocal: false, paginationID: paginationID, status: 'loading', nodeRelationID: paginationID });

    // use memo to avoid re-run
    useMemo(() => {
        const nodeRunner = new NodeRunner(setNode, paginationID, nodeName, paramObject, config);
        NodeRunnerManager.getInstance().addNodeRunner(nodeRunner);
    }, []);

    // when component unmount
    useEffect(() => {
        return NodeRunnerManager.getInstance().getNodeRunner(paginationID)?.markComplete;
    }, []);

    return node;
}

// mutation node
export function mutateNode(nodeName: string, paramObject: any, config?: NodeCallConfig) {
    // node name is required
    if (!nodeName) throw new Error('Node name is required');
    // param object is required or empty object
    if (!paramObject) paramObject = {};

    return new Promise<any>((resolve, reject) => {
        const paginationID = config ? ('paginationID' in config ? (config.paginationID as string) : generateUUID()) : generateUUID();
        const subs = fetchNode(nodeName, paramObject, { ...config, paginationID: paginationID }).subscribe((data:any) => {
            if (data.error) {
                reject(data.error);
                subs.unsubscribe();
            } else if (data.status === 'loaded') {
                resolve(data.data);
                subs.unsubscribe();
            }
        });
    });
}

export function paginationNode(nodeName: string, paramObject: any, config?: NodeCallConfig) {
    // node name is required
    if (!nodeName) throw new Error('Node name is required');
    // param object is required or empty object
    if (!paramObject) paramObject = {};
    // there should be pagination id
    if (!config || !('paginationID' in config)) throw new Error('Pagination node should have paginationID in config');
    const paginationID = config.paginationID as string;
    fetchNode(nodeName, paramObject, { ...config, paginationID: paginationID });
}
