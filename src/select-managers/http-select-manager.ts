import { DatabaseManager } from '../database';
import { findDelta } from '../utils';

export interface SelectManager {
    tables: string[];
    database_name: string;
    name: string;
    data: any;
    latest_result: any;
}

export class HttpSelectManager {
    // first map identifier is browser instance id and second is the  database_name + name
    private selectManagers: Map<string, Map<string, SelectManager>> = new Map();
    private static instance: HttpSelectManager;

    public static getInstance(): HttpSelectManager {
        if (!HttpSelectManager.instance) {
            HttpSelectManager.instance = new HttpSelectManager();
        }
        return HttpSelectManager.instance;
    }

    public deleteAllSelects(clientInstanceUUID: string) {
        this.selectManagers.delete(clientInstanceUUID);
    }

    public addSelect(clientInstanceUUID: string, daoData: SelectManager) {
        if (!this.selectManagers.has(clientInstanceUUID)) {
            this.selectManagers.set(clientInstanceUUID, new Map());
        }

        // if already present then replace with new values
        this.selectManagers.get(clientInstanceUUID)?.set(daoData.database_name + daoData.name, daoData);
    }

    public deleteSelect(clientInstanceUUID: string, database_name: string, name: string) {
        if (this.selectManagers.has(clientInstanceUUID)) {
            const selectsMap = this.selectManagers.get(clientInstanceUUID);
            if (selectsMap) {
                selectsMap.delete(database_name + name);
            }
        }
    }

    private getSelectForRequery(clientInstanceUUID: string, tables: string[]) {
        if (this.selectManagers.has(clientInstanceUUID)) {
            const selectsMap = this.selectManagers.get(clientInstanceUUID);

            const selectToRequery: SelectManager[] = [];

            selectsMap?.forEach((val, key) => {
                const selectManagerSet = new Set(val.tables);
                const tablesSet = new Set(tables);
                const intersection = new Set([...selectManagerSet].filter((x) => tablesSet.has(x)));

                if (intersection.size > 0) {
                    selectToRequery.push(val);
                }
            });

            return selectToRequery;
        } else {
            const selectToRequery: SelectManager[] = [];
            return selectToRequery;
        }
    }

    public async getDelta(clientInstanceUUID: string, tables: string[]) {
        const selectToRequery = this.getSelectForRequery(clientInstanceUUID, tables);

        let daosToRequery: { daoClass: any; selectManager: SelectManager }[] = [];
        const database = DatabaseManager.getInstance();

        selectToRequery.forEach((p) => {
            const databaseName = p.database_name;
            const daoName = p.name;
            daosToRequery.push({ daoClass: database.getDao(databaseName, daoName), selectManager: p });
        });

        daosToRequery = daosToRequery.filter((p) => p.daoClass);

        const finalResults = await Promise.all(
            daosToRequery.map((p) => {
                const daoIns = new p.daoClass();
                daoIns.param_object = p.selectManager.data;
                return daoIns.fetch();
            })
        );

        const forDelta = finalResults.map((p, i) => {
            return { ...daosToRequery[i], finalData: p };
        });

        const withDelta = forDelta.map((p) => {
            const delta = findDelta(p.selectManager.latest_result, p.finalData);
            return { ...p, delta };
        });

        return withDelta.map((p) => {
            const selectMangerNew: SelectManager = {
                data: p.selectManager.data,
                database_name: p.selectManager.database_name,
                name: p.selectManager.name,
                tables: p.selectManager.tables,
                latest_result: p.finalData,
            };

            this.addSelect(clientInstanceUUID, selectMangerNew);

            return { database_name: p.selectManager.database_name, name: p.selectManager.name, delta: p.delta };
        });
    }
}
