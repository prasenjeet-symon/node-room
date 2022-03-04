import { ConnectMysql, SQLQueryMaker } from '../MYSQL/connect-mysql'

export class SqlSelectQueryRunner {
    public extractTableDBName(sql: string, default_database_name: string) {
        // all type of joins  are 'INNER JOIN' , 'LEFT JOIN' , 'RIGHT JOIN' , 'FULL OUTER JOIN'
        // first find the table name of normal select with FROM
        const splitedValues = sql.replace(/\s+/g, ' ').split(/\s/g)

        const findAllIndexOfFrom: number[] = []
        splitedValues.forEach((p, i) => {
            if (p.toLowerCase() === 'from') {
                findAllIndexOfFrom.push(i)
            }
        })

        const fromTableNames = findAllIndexOfFrom.map((p, i) => {
            const tableDbString = splitedValues.slice(p + 1, p + 2)[0]
            // if the tableDbString is not valid SQL name then return
            if (!new RegExp(/^[a-zA-Z0-9._]*$/).test(tableDbString)) {
                return
            }

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
                return {
                    database_name: default_database_name,
                    table_name: dotSplittedTableDbString[0],
                }
            }
        })

        // find the join table names
        const findAllIndexOfJoin: number[] = []
        splitedValues.forEach((p, i) => {
            if (p.toLowerCase() === 'join') {
                findAllIndexOfJoin.push(i)
            }
        })

        const joinTableNames = findAllIndexOfJoin.map((p, i) => {
            const tableDbString = splitedValues.slice(p + 1, p + 2)[0]
            if (!new RegExp(/^[a-zA-Z0-9._]*$/).test(tableDbString)) {
                return
            }

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
                return {
                    database_name: default_database_name,
                    table_name: dotSplittedTableDbString[0],
                }
            }
        })

        const allTableNames = [...fromTableNames, ...joinTableNames]
        return allTableNames.filter((p) => p)
    }

    public async run(sql: string, database_name: string): Promise<any> {
        const MYSQL = ConnectMysql.getInstance()
        const queryMaker = MYSQL.getSQLQueryMaker(database_name)
        const tableNames = this.extractTableDBName(sql, database_name)

        const results = await queryMaker.query(sql)

        return { tables: tableNames, results: results }
    }

    public async runByTransaction(sql: string, database_name: string, sqlQueryMaker: SQLQueryMaker) {
        const tableNames = this.extractTableDBName(sql, database_name)
        const results = await sqlQueryMaker.query(sql)
        return { tables: tableNames, results: results }
    }
}
