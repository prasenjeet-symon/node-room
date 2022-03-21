import { DatabaseManager } from '../database';
import { DaoConfig, SelectCache, SelectCacheRequery } from '../main-interface';

export class DaoRunner {
    private dao: any;
    private daoInstance: any;

    constructor(private databaseName: string, private daoName: string, private paramObject: any) {
        this.dao = DatabaseManager.getInstance().getDao(databaseName, daoName);
    }

    public async run() {
        try {
            const daoToRun = new this.dao();
            // set the property on the dao instance
            // we set any property on the dao instance to be able to access it from the dao
            daoToRun.param_object = this.paramObject;
            const result = await daoToRun.fetch();
            this.daoInstance = daoToRun;

            return result;
        } catch (error) {
            throw error;
        }
    }

    public getDaoConfig(): DaoConfig {
        return this.daoInstance.daoConfig;
    }
}

export class DaoRequeryRunner {
    private requeriedDaos: SelectCacheRequery[] = [];

    constructor(private cachedDaos: SelectCache[]) {}

    // re run the daos
    // TODO : use promise all
    public async reQuery() {
        for (const cacheDao of this.cachedDaos) {
            const daoToRun = new DaoRunner(cacheDao.databaseName, cacheDao.daoName, cacheDao.paramObject);
            try {
                const result = await daoToRun.run();
                this.requeriedDaos.push({
                    daoIdentifier: cacheDao.daoIdentifier,
                    databaseName: cacheDao.databaseName,
                    daoName: cacheDao.daoName,
                    id: cacheDao.id,
                    paramObject: cacheDao.paramObject,
                    label: cacheDao.label,
                    result: cacheDao.result,
                    latestResult: result,
                });
            } catch (error) {
                console.log(error);
                // do not throw error
                this.requeriedDaos.push({
                    daoIdentifier: cacheDao.daoIdentifier,
                    databaseName: cacheDao.databaseName,
                    daoName: cacheDao.daoName,
                    id: cacheDao.id,
                    paramObject: cacheDao.paramObject,
                    label: cacheDao.label,
                    result: cacheDao.result,
                    latestResult: cacheDao.result,
                });
            }
        }

        return this.requeriedDaos;
    }
}
