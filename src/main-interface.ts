export interface SelectCache {
    daoIdentifier: string;
    databaseName: string;
    daoName: string;
    id: string;
    paramObject: any;
    label: Label[];
    result: any;
}

export interface SelectCacheRequery {
    daoIdentifier: string;
    databaseName: string;
    daoName: string;
    id: string;
    paramObject: any;
    label: Label[];
    result: any;
    latestResult: any;
}

export type DaoMode = 'T' | 'C' | 'R' | 'U' | 'D';

// dao query config
export interface DaoConfig {
    mode: DaoMode;
    id: string;
    labels: Label[];
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

// when type
export type WhenTypeFunction = (paramName: string) => (paramObject: any) => string | number;
export type WhenParamType = string | WhenTypeFunction;

export type When = (selfParamObject: any, mNodeParamObject: any) => boolean;
export interface Label {
    label: string;
    when: When;
}
