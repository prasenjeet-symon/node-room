import mysql from 'mysql2';

export class ConnectMysql {
    private static instance: ConnectMysql;

    // mysql config
    private host: string;
    private password: string;
    private port: number;
    private user: string;

    private connections: Map<string, mysql.Connection> = new Map();

    private constructor() {
        this.host = process.env.MYSQL_HOST || 'localhost';
        this.password = process.env.MYSQL_PASSWORD || '';
        this.port = Number(process.env.MYSQL_PORT) || 3306;
        this.user = process.env.MYSQL_USER || 'root';
    }

    public static getInstance(): ConnectMysql {
        if (!ConnectMysql.instance) {
            ConnectMysql.instance = new ConnectMysql();
        }

        return ConnectMysql.instance;
    }

    public connect(database_name: string): Promise<mysql.Connection> {
        return new Promise((resolve, reject) => {
            const connection = mysql.createConnection({
                user: this.user,
                host: this.host,
                password: this.password,
                database: database_name,
                port: this.port,
                multipleStatements: true,
            });

            connection.connect((err) => {
                if (err) {
                    reject(err);
                } else {
                    this.connections.set(database_name, connection);
                    resolve(connection);
                }
            });
        });
    }

    public getSQLQueryMaker(database_name: string): SQLQueryMaker {
        const connection = this.connections.get(database_name);
        if (!connection) {
            throw new Error('Connection not found');
        }
        return new SQLQueryMaker(connection);
    }
}

export class SQLQueryMaker {
    constructor(private connection: mysql.Connection) {}

    public async query(sql: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public async startTransaction(): Promise<void> {
        await this.query('START TRANSACTION;');
    }

    public async commit(): Promise<void> {
        await this.query('COMMIT;');
    }

    public async rollback(): Promise<void> {
        await this.query('ROLLBACK;');
    }
}
