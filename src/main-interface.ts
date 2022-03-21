export interface SelectCache {
    daoIdentifier: string;
    databaseName: string;
    daoName: string;
    id: string;
    paramObject: any;
    paramLabel: string;
    result: any;
}
export interface SelectCacheRequery {
    daoIdentifier: string;
    databaseName: string;
    daoName: string;
    id: string;
    paramObject: any;
    paramLabel: string;
    result: any;
    latestResult: any;
}

export type DaoMode = 'T' | 'C' | 'R' | 'U' | 'D';

// dao query config
export interface DaoConfig {
    mode: DaoMode;
    strictLabels: string[];
    universalLabels: string[];
    paramLabels: string;
    id: string;
}

// dao client run data
export interface DaoClientRunData {
    databaseName: string;
    daoName: string;
    paramObject: any;
}

// dao client run data result
export interface DaoClientRunDataResult {
    result: any;
}
