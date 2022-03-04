import { DatabaseManager } from '../database';
import { findDelta } from '../utils';
import { SelectManager } from './http-select-manager';

export class SocketSelectManager {
    private static _instance: SocketSelectManager;
    private selectManagers: Map<string, Map<string, SelectManager>> = new Map();

    public static getInstance(): SocketSelectManager {
        if (!SocketSelectManager._instance) {
            SocketSelectManager._instance = new SocketSelectManager();
        }
        return SocketSelectManager._instance;
    }

    private constructor() {}

    public addSelect(socketID: string, daoData: SelectManager) {
        if (!this.selectManagers.has(socketID)) {
            this.selectManagers.set(socketID, new Map());
        }

        // if already present then replace with new values
        this.selectManagers.get(socketID)?.set(daoData.database_name + daoData.name, daoData);
    }

    public removeSelect(socketID: string, databaseName: string, daoName: string) {
        if (this.selectManagers.has(socketID)) {
            this.selectManagers.get(socketID)?.delete(databaseName + daoName);
        }
    }

    public removeAllSelects(socketID: string) {
        if (this.selectManagers.has(socketID)) {
            this.selectManagers.delete(socketID);
        }
    }

    public getAllSelectsOfSocket(socketID: string) {
        if (this.selectManagers.has(socketID)) {
            return this.selectManagers.get(socketID)?.size as number;
        } else {
            return 0;
        }
    }

    private getSelectForRequery(socketID: string, table: string) {
        if (this.selectManagers.has(socketID)) {
            const selectsMap = this.selectManagers.get(socketID);

            const selectToRequery: SelectManager[] = [];

            selectsMap?.forEach((val, key) => {
                if (val.tables.includes(table)) {
                    selectToRequery.push(val);
                }
            });

            return selectToRequery;
        } else {
            const selectToRequery: SelectManager[] = [];
            return selectToRequery;
        }
    }

    private async getDelta(socketID: string, table: string) {
        const selectToRequery = this.getSelectForRequery(socketID, table);

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

            this.addSelect(socketID, selectMangerNew);

            return { database_name: p.selectManager.database_name, name: p.selectManager.name, delta: p.delta };
        });
    }

    public async getAllDelta(table: string) {
        const finalDeltas: any[] = [];

        for (const socketID of this.selectManagers.keys()) {
            const results = await this.getDelta(socketID, table);
            finalDeltas.push({ socketID, allDelta: results });
        }

        return finalDeltas;
    }
}
