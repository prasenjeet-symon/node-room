import { ConnectMysql, SQLQueryMaker } from '../MYSQL/connect-mysql';
import { valueType } from '../utils';

export class SqlCreateQueryRunner {
    private extractTableDbName(sql: string) {
        // we are suuming that there is no error in the sql
        const splitedValues = sql.replace(/\s+/g, ' ').split(/\s/g);
        const updateInitialIndex = splitedValues.findIndex((val) => val.toLowerCase() === 'into');

        const tableDbString = splitedValues.slice(updateInitialIndex + 1, updateInitialIndex + 2)[0];

        // if in the string there is dot then there is database name , otherwise not
        const dotSplittedTableDbString = tableDbString.trim().split('.');
        if (dotSplittedTableDbString.length === 2) {
            // there is database name
            return {
                database_name: dotSplittedTableDbString[0],
                table_name: dotSplittedTableDbString[1],
            };
        } else {
            // there is only table name with default database
            return { database_name: null, table_name: dotSplittedTableDbString[0] };
        }
    }

    private async queryCreatedRows(database_name: string | null, table_name: string, ids: number[], sqlQueryMaker: SQLQueryMaker) {
        const result = sqlQueryMaker.query(`SELECT * FROM ${database_name ? database_name + '.' : ''}${table_name} WHERE id IN (${ids.join(',')})`);
        return result;
    }

    public async run(sql: string, database_name: string) {
        const MYSQL = ConnectMysql.getInstance();
        const queryMaker = MYSQL.getSQLQueryMaker(database_name);
        const tableDbName = this.extractTableDbName(sql);

        await queryMaker.startTransaction();

        let insertedRows: any = await queryMaker.query(sql);

        if (valueType(insertedRows) !== 'array') {
            insertedRows = [insertedRows];
        }

        const ids = insertedRows.map((row: any) => row.insertId);

        const rows = await this.queryCreatedRows(tableDbName.database_name, tableDbName.table_name, ids, queryMaker);

        await queryMaker.commit();

        const finalTable = {
            database_name: tableDbName.database_name ? tableDbName.database_name : database_name,
            table_name: tableDbName.table_name,
        };

        // return inserted rows
        return { tables: [finalTable], results: rows };
    }

    public async runByTransaction(sql: string, database_name: string, sqlQueryMaker: SQLQueryMaker) {
        const tableDbName = this.extractTableDbName(sql);

        let insertedRows = await sqlQueryMaker.query(sql);
        if (valueType(insertedRows) !== 'array') {
            insertedRows = [insertedRows];
        }

        const ids = insertedRows.map((row: any) => row.insertId);

        const rows = await this.queryCreatedRows(tableDbName.database_name, tableDbName.table_name, ids, sqlQueryMaker);

        const finalTable = {
            database_name: tableDbName.database_name ? tableDbName.database_name : database_name,
            table_name: tableDbName.table_name,
        };

        // return inserted rows
        return { tables: [finalTable], results: rows };
    }
}
