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
    constructor(private database_instance: any) {}

    public getDatabaseName(): string {
        return this.database_instance.getDatabaseName();
    }

    public getDao(dao_name: string): any {
        return this.database_instance.getDao(dao_name);
    }
}
