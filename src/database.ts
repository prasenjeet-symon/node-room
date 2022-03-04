import { ConnectMysql } from './MYSQL/connect-mysql';

export class DatabaseManager {
    private static _instance: DatabaseManager;
    private databases: Map<string, DatabaseClient> = new Map();

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager._instance) {
            DatabaseManager._instance = new DatabaseManager();
        }
        return DatabaseManager._instance;
    }

    private constructor() {}

    // add database
    public addDatabase(databaseName: string, databaseClient: DatabaseClient) {
        this.databases.set(databaseName, databaseClient);
    }

    public getDao(database_name: string, name: string) {
        return this.databases.get(database_name)?.getDao(name);
    }
}

export class DatabaseClient {
    constructor(private database_instance: any, private migrate: boolean = false) {
        // create all the tables
        const database_name = this.database_instance.getDatabaseName();
        const allTableCreationQuery = this.database_instance.allTableCreationQuery();

        const MYSQL = ConnectMysql.getInstance();
        const sqlQueryMaker = MYSQL.getSQLQueryMaker(database_name);

        if (this.migrate) {
            sqlQueryMaker.query(allTableCreationQuery).then(() => console.log('all tables created'));
        }
    }

    // get database name
    public getDatabaseName(): string {
        return this.database_instance.getDatabaseName();
    }

    // get dao
    public getDao(dao_name: string): any {
        return this.database_instance.getDao(dao_name);
    }
}
