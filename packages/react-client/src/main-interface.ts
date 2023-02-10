export type loading_status = 'loading' | 'loaded' | 'error';

export interface signalResult {
    status: loading_status;
    error: any | null;
    data: any | null;
    isLocal: boolean;
    paginationID: string | null;
    nodeRelationID: string | null;
}
