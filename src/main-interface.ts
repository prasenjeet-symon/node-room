export interface MYSQLConnectionConfig {
    host: string;
    port: number;
    password: string;
    user: string;
}

export type table_config = {
    primaryKey: string;
    tableCode: string;
};

export type column_config = {
    dataType: any;
    columnID: string;
    isNotNull?: boolean;
    defaultValue?: any;
};

export interface TableConfig {
    tableName: string;
    primaryKey: string;
    ColumnInfo: {
        dataType: any;
        columnID: string;
        columnName: string;
        isNotNull: boolean;
        defaultValue: any;
    }[];
}

export interface DaoRunData {
    database_name: string;
    name: string;
    data: any;
}

export type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
