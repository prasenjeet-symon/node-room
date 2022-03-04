import { QueryType } from '../main-interface';
import { HttpSelectManager, SelectManager } from '../select-managers/http-select-manager';
import { SocketSelectManager } from '../select-managers/socket-select-manager';

export interface DaoResults {
    type: 'U' | 'D' | 'I' | 'S';
    tables: { database_name: string; table_name: string }[];
    data: any;
}

export class CDao<T> {
    protected dao_type = 'compute';
    protected query_type: QueryType = 'SELECT';

    protected dao_name!: string; // will be assigned by the client at the time of calling the dao
    protected database_name!: string; // will be assigned by the client at the runtime
    protected requested_by = 'server'; // will be assigned by the client at the time of calling the dao
    protected runMode: 'http' | 'socket' = 'http'; // will be assigned by the client at the time of calling the dao
    protected socketRunConfig: { socketID: string } = { socketID: '' }; // will be assigned by the client at the time of calling the dao
    protected httpRunConfig: { cacheSelect: boolean; clientInstanceUUID: string } = { cacheSelect: false, clientInstanceUUID: '' }; // will be assigned by the client at the time of calling the dao
    protected param_object: any; // will be called by the client at the time of calling the dao

    protected allDaosResults: DaoResults[] = [];
    protected mutationTables: string[] = [];

    /**
     * Call this method to push the results of the dao to the allDaosResults array
     * This method will be called by the dao's fetch method
     * @param results : Dao results
     */
    protected pushDaoResult(results: DaoResults) {
        this.allDaosResults.push(results);

        if (results.type !== 'S') {
            this.mutationTables.push(results.tables[0].table_name);
        }
    }

    protected decideSelectCache() {
        // if type of all dao results is 'S' then cache
        const isAllDaoSelect = this.allDaosResults.length !== 0 && this.allDaosResults.filter((p) => p.type === 'S').length === this.allDaosResults.length ? true : false;
        const allTables: { database_name: string; table_name: string }[] = [];

        this.allDaosResults.forEach((p) => {
            p.tables.forEach((q) => {
                allTables.push(q);
            });
        });

        const all_table_names: string[] = allTables.map((p) => p.table_name);

        // find unique table names
        const unique_table_names = [...new Set(all_table_names)];

        return { isAllDaoSelect, unique_table_names };
    }

    protected cacheSelect(final_results: any) {
        const { isAllDaoSelect, unique_table_names } = this.decideSelectCache();
        if (isAllDaoSelect) {
            this.query_type = 'SELECT';
            // Since all dao results are select, cache the results
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
                        latest_result: final_results,
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
                        latest_result: final_results,
                        name: this.dao_name,
                    };

                    socketSelectManager.addSelect(this.socketRunConfig.socketID, selectManger);
                }
            }
        } else {
            this.query_type = 'UPDATE';
        }
    }
}
