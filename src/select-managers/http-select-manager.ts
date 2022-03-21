import { createHash } from 'crypto';
import { SelectCache } from '../main-interface';

export class HttpSelectManager {
    private strictLabels: Map<string, Set<string>> = new Map();
    private universalLabels: Map<string, Set<string>> = new Map();
    private selectCache: Map<string, SelectCache> = new Map();

    constructor() {}

    /**
     *
     * @param daoName : Name of the dao to add
     * @param strictLabels : Strict labels to add
     * @param universalLabels : Universal labels to add
     * @param paramObject : Param object to add
     * @param paramLabel : Param label to add
     * @param result : dao query result
     */
    public addDao(databaseName: string, daoName: string, id: string, strictLabels: string[], universalLabels: string[], paramObject: any, paramLabel: string, result: any) {
        const daoIdentifier = this.generateDaoIdentifier(databaseName, daoName, paramObject);
        // add the dao to the select cache
        // since the dao identifier is unique, we can use it as the key and map will replace the old value
        this.selectCache.set(daoIdentifier, {
            daoIdentifier,
            databaseName,
            daoName,
            id,
            paramObject,
            paramLabel,
            result: JSON.stringify(result),
        });

        // add the strict labels
        for (const label of strictLabels) {
            if (!this.strictLabels.has(label)) {
                this.strictLabels.set(label, new Set());
            }

            this.strictLabels.get(label)?.add(daoIdentifier);
        }

        // add the universal labels
        for (const label of universalLabels) {
            if (!this.universalLabels.has(label)) {
                this.universalLabels.set(label, new Set());
            }

            this.universalLabels.get(label)?.add(daoIdentifier);
        }

        return daoIdentifier;
    }
    /**
     * Get the dao from the cache
     *
     */
    public getDao(strictLabels: string[], universalLabels: string[], paramObject: any): SelectCache[] {
        // get the daos that match the strict labels
        const allStrictLabelDaos = [];

        for (const label of strictLabels) {
            if (this.strictLabels.has(label)) {
                const daos = this.strictLabels.get(label);
                if (daos) {
                    // set to an array
                    const daoArray = Array.from(daos);
                    allStrictLabelDaos.push(...daoArray);
                }
            }
        }

        // convert to a set, we need only unique values
        const allStrictLabelDaosSet = new Set(allStrictLabelDaos);
        const finalStrictLabelDaos: string[] = [];

        for (const daoIdentifier of allStrictLabelDaosSet) {
            const dao = this.selectCache.get(daoIdentifier);
            if (dao) {
                // we need to check the param label
                const paramLabel = dao.paramLabel;
                const prevParamObject = dao.paramObject;
                const currenParamObject = paramObject;
                if (prevParamObject[paramLabel] !== undefined && currenParamObject[paramLabel] !== undefined && prevParamObject[paramLabel] === currenParamObject[paramLabel]) {
                    finalStrictLabelDaos.push(daoIdentifier);
                }
            }
        }

        // get the daos that match the universal labels
        const allUniversalLabelDaos: string[] = [];

        for (const label of universalLabels) {
            if (this.universalLabels.has(label)) {
                const daos = this.universalLabels.get(label);
                if (daos) {
                    // set to an array
                    const daoArray = Array.from(daos);
                    allUniversalLabelDaos.push(...daoArray);
                }
            }
        }

        // convert to a set, we need only unique values
        const allUniversalLabelDaosSet = new Set(allUniversalLabelDaos);
        const finalUniversalLabelDaos: string[] = Array.from(allUniversalLabelDaosSet);

        // array of all final dao identifiers
        const allDaos = Array.from(new Set([...finalStrictLabelDaos, ...finalUniversalLabelDaos]));

        // get the dao from the cache
        const allDaosFinal: SelectCache[] = [];
        for (const daoIdentifier of allDaos) {
            const dao = this.selectCache.get(daoIdentifier);
            if (dao) {
                allDaosFinal.push(dao);
            }
        }

        // return the dao
        return allDaosFinal;
    }

    // update the daos with latest result
    public updateDao(daoIdentifier: string, result: any) {
        const dao = this.selectCache.get(daoIdentifier);
        if (dao) {
            dao.result = JSON.stringify(result);
        }
    }
    /**
     * Generate the dao identifier
     */
    public generateDaoIdentifier(databaseName: string, daoName: string, paramObject: any): string {
        const hash = createHash('sha256');
        hash.update(databaseName);
        hash.update(daoName);
        hash.update(JSON.stringify(paramObject));
        return hash.digest('hex');
    }
}
