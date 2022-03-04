import { ChangeDetector } from '../change-detector';
import { QueryType } from '../main-interface';
import { HttpSelectManager, SelectManager } from '../select-managers/http-select-manager';
import { SocketSelectManager } from '../select-managers/socket-select-manager';
import { DaoResults } from './dao-compute-base';
import { ChangesType } from './dao-transaction-base';

export class Dao<T> {
    protected env: any;
    protected dao_type = 'normal';
    protected query_type: QueryType = 'SELECT';
    protected mutationTables: string[] = [];

    protected dao_name!: string;
    protected database_name!: string;
    protected requested_by = 'server';
    protected runMode: 'http' | 'socket' = 'http';
    protected httpRunConfig: { cacheSelect: boolean; clientInstanceUUID: string } = { cacheSelect: false, clientInstanceUUID: '' };
    protected socketRunConfig: { socketID: string } = { socketID: '' };
    protected param_object: any;

    /** Intial unmodified data */
    public DBData!: T;

    constructor(env?: any) {
        if (env) {
            this.env = env;
        } else {
            this.env = undefined;
        }
    }

    public emitChange(change: ChangesType) {
        const changeDetector = ChangeDetector.getInstance();
        changeDetector.changeDetected(change);
        this.mutationTables.push(change.tables[0].table_name);
    }

    public cacheSelect(dao: DaoResults) {
        const unique_table_names = [...new Set(dao.tables.map((table) => table.table_name))];

        if (this.requested_by !== 'server') {
            // if requested by client, then cache the results
            if (this.runMode === 'http' && this.httpRunConfig && this.httpRunConfig.cacheSelect) {
                // get the http select manager instance
                const httpSelectManager = HttpSelectManager.getInstance();
                // cache the select
                const selectManger: SelectManager = {
                    tables: unique_table_names,
                    database_name: this.database_name,
                    data: this.param_object,
                    latest_result: dao.data,
                    name: this.dao_name,
                };

                httpSelectManager.addSelect(this.httpRunConfig.clientInstanceUUID, selectManger);
            } else if (this.runMode === 'socket') {
                // get the socket select manager instance
                const socketSelectManager = SocketSelectManager.getInstance();
                // cache the select
                const selectManger: SelectManager = {
                    tables: unique_table_names,
                    database_name: this.database_name,
                    data: this.param_object,
                    latest_result: dao.data,
                    name: this.dao_name,
                };

                socketSelectManager.addSelect(this.socketRunConfig.socketID, selectManger);
            }
        }
    }
}
