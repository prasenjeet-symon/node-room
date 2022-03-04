import { column_config, TableConfig, table_config } from '../main-interface';
import { define_property_on_object, parse_sql_string, table_config_key } from '../utils';

export function Table(config: table_config) {
    return function <
        T extends {
            new (...args: any[]): {};
        }
    >(constructor: T): T {
        // if the table name is not provided then fallback to class name
        const table_name: string = constructor.name.trim();

        if (!config.primaryKey) {
            // throw the error
            throw new Error(`Primary key is required for the table - ${table_name}`);
        }

        if (config.primaryKey !== 'id') {
            throw new Error(`Primary key should be named as 'id' for the table - ${table_name}`);
        }

        if (!config.tableCode) {
            throw new Error(`Table code is required for the table - ${table_name}`);
        }

        const class_name = constructor.name.trim();
        const class_prototype = constructor.prototype;

        const TABLE_CONFIG_KEY = table_config_key(class_name);
        let prev_table_config = class_prototype[TABLE_CONFIG_KEY] as TableConfig;
        if (prev_table_config) {
            // there is prev table config
            prev_table_config.tableName = table_name;
            prev_table_config.primaryKey = config.primaryKey;
            define_property_on_object(class_prototype, TABLE_CONFIG_KEY, prev_table_config);
        } else {
            prev_table_config = {
                tableName: table_name,
                primaryKey: config.primaryKey,
                ColumnInfo: [],
            };
            define_property_on_object(class_prototype, TABLE_CONFIG_KEY, prev_table_config);
        }

        const columns = prev_table_config.ColumnInfo.map((column) => {
            if (column.columnName === prev_table_config.primaryKey) {
                // primary key column
                return ` ${column.columnName} ${column.dataType} PRIMARY KEY AUTO_INCREMENT`;
            } else {
                // not a primary key column
                return ` ${column.columnName} ${column.dataType} ${column.isNotNull ? `NOT NULL` : ``} ${column.defaultValue ? 'DEFAULT ' + parse_sql_string(column.defaultValue) : ``}`;
            }
        });

        const columns_string = columns.join(', ');
        const SQLCreateStatement = ` CREATE TABLE IF NOT EXISTS ${prev_table_config.tableName} ( ${columns_string} );`;

        return class extends constructor {
            public table_name: string = prev_table_config.tableName;
            private tableCreationQuery: string = SQLCreateStatement;

            public generateTableQuery = () => {
                return this.tableCreationQuery;
            };
        };
    };
}

export function Column(config: column_config) {
    return function (target: Object, propertyKey: string | symbol): void {
        const class_name = target.constructor.name.trim();
        const class_prototype = target.constructor.prototype;
        const table_name = class_name;

        // if the column name is not provided then use the default property key
        const column_name: string = propertyKey as string;

        if (!config.columnID) {
            // throw the error
            throw new Error(`Column ID is required for the column - '${column_name}' in the table - '${table_name}''`);
        }

        if (!config.dataType) {
            throw new Error(`Data type is required for the column - '${column_name}' in the table - '${table_name}'`);
        }

        const TABLE_CONFIG_KEY = table_config_key(class_name);
        let prev_table_config = class_prototype[TABLE_CONFIG_KEY] as TableConfig;

        if (prev_table_config) {
            prev_table_config.ColumnInfo = [
                ...prev_table_config.ColumnInfo,
                {
                    columnName: column_name,
                    columnID: config.columnID,
                    dataType: config.dataType,
                    isNotNull: config.isNotNull === true ? true : false,
                    defaultValue: config.defaultValue,
                },
            ];
            define_property_on_object(class_prototype, TABLE_CONFIG_KEY, prev_table_config);
        } else {
            prev_table_config = {
                tableName: table_name,
                primaryKey: '',
                ColumnInfo: [
                    {
                        columnName: column_name,
                        columnID: config.columnID,
                        dataType: config.dataType,
                        isNotNull: config.isNotNull === true ? true : false,
                        defaultValue: config.defaultValue,
                    },
                ],
            };

            define_property_on_object(class_prototype, TABLE_CONFIG_KEY, prev_table_config);
        }
    };
}
