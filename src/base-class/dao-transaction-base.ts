import { ChangeDetector } from '../change-detector';
import { QueryType } from '../main-interface';
import { SQLQueryMaker } from '../MYSQL/connect-mysql';

export interface ChangesType {
    type: 'U' | 'D' | 'I';
    tables: { database_name: string; table_name: string }[];
    data: any;
}

export class TDao<T> {
    protected dao_type = 'transaction';
    protected env: any;
    protected query_type: QueryType = 'UPDATE';

    // these properties will be assigned by the client
    protected dao_name!: string;
    protected database_name!: string;
    protected requested_by = 'server';

    // these properties will be assigned by the fetch method at the time of fetch call
    protected sqlQueryMaker!: SQLQueryMaker;
    protected changes: ChangesType[] = [];
    protected param_object: any;
    protected mutationTables: string[] = [];

    constructor(env?: any) {
        if (env) {
            this.env = env;
        } else {
            this.env = undefined;
        }
    }

    // Add the changes to the changes array, run at the time of insert, update and delete by user
    protected addChanges(change: ChangesType) {
        this.changes.push(change);
        this.mutationTables.push(change.tables[0].table_name);
    }

    // Only the transaction dao and base dao emit the changes
    protected flushChanges() {
        const changeDetector = ChangeDetector.getInstance();
        this.changes.forEach((change) => {
            changeDetector.changeDetected(change);
        });
    }

    // Clear the changes , run at the time fetch call by user
    protected clearChanges() {
        this.changes = [];
    }
}
