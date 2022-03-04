import { ConnectMysql, SQLQueryMaker } from '../MYSQL/connect-mysql'

export class SqlDeleteQueryRunner {
    public extractTableDBName(sql: string) {
        // we are suuming that there is no error in the sql
        const splitedValues = sql.replace(/\s+/g, ' ').split(/\s/g)
        const fromInitialIndex = splitedValues.findIndex((val) => val.toLowerCase() === 'from')

        const tableDbString = splitedValues.slice(fromInitialIndex + 1, fromInitialIndex + 2)[0]

        // if in the string there is dot then there is database name , otherwise not
        const dotSplittedTableDbString = tableDbString.trim().split('.')
        if (dotSplittedTableDbString.length === 2) {
            // there is database name
            return {
                database_name: dotSplittedTableDbString[0],
                table_name: dotSplittedTableDbString[1],
            }
        } else {
            // there is only table name with default database
            return { database_name: null, table_name: dotSplittedTableDbString[0] }
        }
    }

    public extractCondition(sql: string) {
        // extract the condition from the sql , that is after the WHERE clause
        const splittedSQL = sql.replace(/\s+/g, ' ').split(/\s/g)
        const whereInitialIndex = splittedSQL.findIndex((val) => val.toLowerCase() === 'where')
        const condition = splittedSQL.slice(whereInitialIndex + 1).join(' ')
        return condition
    }

    public makeSelectQueryWithCondition(databaseName: string | null, tableName: string, condition: string) {
        const selectQuery = `SELECT * FROM ${databaseName ? databaseName + '.' : ''}${tableName} WHERE ${condition}`
        return selectQuery
    }

    private extractToBeDeletedData(sql: string) {
        const tableDbName = this.extractTableDBName(sql)
        const condition = this.extractCondition(sql)

        const selectQuery = this.makeSelectQueryWithCondition(tableDbName.database_name, tableDbName.table_name, condition)

        return selectQuery
    }

    public async run(sql: string, database_name: string) {
        const MYSQL = ConnectMysql.getInstance()
        const queryMaker = MYSQL.getSQLQueryMaker(database_name)
        const tableDbName = this.extractTableDBName(sql)
        const finalTableNames = {
            database_name: tableDbName.database_name ? tableDbName.database_name : database_name,
            table_name: tableDbName.table_name,
        }

        await queryMaker.startTransaction()
        const toBeDeleteData = await queryMaker.query(this.extractToBeDeletedData(sql))
        await queryMaker.query(sql)
        await queryMaker.commit()

        return { tables: [finalTableNames], results: toBeDeleteData }
    }

    public async runByTransaction(sql: string, database_name: string, sqlQueryMaker: SQLQueryMaker) {
        const tableDbName = this.extractTableDBName(sql)
        const finalTableNames = {
            database_name: tableDbName.database_name ? tableDbName.database_name : database_name,
            table_name: tableDbName.table_name,
        }

        const toBeDeleteData = await sqlQueryMaker.query(this.extractToBeDeletedData(sql))

        await sqlQueryMaker.query(sql)

        return { tables: [finalTableNames], results: toBeDeleteData }
    }
}
