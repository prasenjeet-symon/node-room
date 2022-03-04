import { ConnectMysql, SQLQueryMaker } from '../MYSQL/connect-mysql';
import { SqlDeleteQueryRunner } from './sql-delete-runner';

export class SqlUpdateQueryRunner {
    constructor() {}

    public extractTableDBName(sql: string) {
        // we are suuming that there is no error in the sql
        const splitedValues = sql.replace(/\s+/g, ' ').split(/\s/g);
        const updateInitialIndex = splitedValues.findIndex((val) => val.toLowerCase() === 'update');

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

    private extractRowsToBeUpdated(sql: string) {
        const tableDbName = this.extractTableDBName(sql);
        const condition = new SqlDeleteQueryRunner().extractCondition(sql);

        const selectQuery = new SqlDeleteQueryRunner().makeSelectQueryWithCondition(tableDbName.database_name, tableDbName.table_name, condition);

        return selectQuery;
    }

    public async run(sql: string, database_name: string) {
        const MYSQL = ConnectMysql.getInstance();
        const queryMaker = MYSQL.getSQLQueryMaker(database_name);

        await queryMaker.startTransaction();
        const beforeData = await queryMaker.query(this.extractRowsToBeUpdated(sql));
        await queryMaker.query(sql);
        const afterData = await queryMaker.query(this.extractRowsToBeUpdated(sql));
        await queryMaker.commit();

        const tableDbName = this.extractTableDBName(sql);
        const finalTable = {
            database_name: tableDbName.database_name ? tableDbName.database_name : database_name,
            table_name: tableDbName.table_name,
        };

        return { tables: [finalTable], results: { beforeData, afterData } };
    }

    public async runByTransaction(sql: string, database_name: string, sqlQueryMaker: SQLQueryMaker) {
        const beforeData = await sqlQueryMaker.query(this.extractRowsToBeUpdated(sql));
        await sqlQueryMaker.query(sql);
        const afterData = await sqlQueryMaker.query(this.extractRowsToBeUpdated(sql));

        const tableDbName = this.extractTableDBName(sql);
        const finalTable = {
            database_name: tableDbName.database_name ? tableDbName.database_name : database_name,
            table_name: tableDbName.table_name,
        };

        return { tables: [finalTable], results: { beforeData, afterData } };
    }
}
