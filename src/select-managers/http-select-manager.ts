import { createHash } from 'crypto';
import { Label, SelectCache } from '../main-interface';
import { removeDuplicateValuesFromArray } from '../utils';

export class HttpSelectManager {
    private strictLabels: Map<string, Set<string>> = new Map();
    private selectCache: Map<string, SelectCache> = new Map();

    constructor() {}

    /**
     *
     * @param daoName : Name of the dao to add
     * @param labels : Param label to add
     * @param result : dao query result
     */
    public addDao(databaseName: string, daoName: string, id: string, paramObject: any, labels: Label[], result: any) {
        const daoIdentifier = this.generateDaoIdentifier(databaseName, daoName, paramObject);
        // add the dao to the select cache
        // since the dao identifier is unique, we can use it as the key and map will replace the old value
        this.selectCache.set(daoIdentifier, {
            daoIdentifier,
            databaseName,
            daoName,
            id,
            paramObject,
            label: labels,
            result: JSON.stringify(result),
        });

        const strictLabels = labels.map((label) => label.label);

        // add the strict labels
        for (const label of strictLabels) {
            if (!this.strictLabels.has(label)) {
                this.strictLabels.set(label, new Set());
            }

            this.strictLabels.get(label)?.add(daoIdentifier);
        }

        return daoIdentifier;
    }
    /**
     * Get the dao from the cache
     *
     */
    public getDao(strictLabels: string[], paramObject: any): SelectCache[] {
        // get the daos that match the strict labels
        const allStrictLabelDaos: { label: string; daoIdentifier: string }[] = [];

        for (const label of strictLabels) {
            if (this.strictLabels.has(label)) {
                const daos = this.strictLabels.get(label);
                if (daos) {
                    // set to an array
                    const daoArray = Array.from(daos); // list of all daoidentifiers
                    allStrictLabelDaos.push(...daoArray.map((daoIdentifier) => ({ label, daoIdentifier })));
                }
            }
        }

        // convert to a set, we need only unique values
        const allStrictLabelDaosSet = removeDuplicateValuesFromArray(allStrictLabelDaos, 'daoIdentifier', 'label');
        const finalStrictLabelDaos: string[] = [];

        for (const daoIdentifier of allStrictLabelDaosSet) {
            const dao = this.selectCache.get(daoIdentifier.daoIdentifier);
            if (dao) {
                // we need to check the param label
                const isMatch = dao.label.filter((p) => p.label === daoIdentifier.label).find((label) => label.when(dao.paramObject, paramObject));

                if (isMatch) {
                    finalStrictLabelDaos.push(daoIdentifier.daoIdentifier);
                }
            }
        }

        // array of all final dao identifiers
        const allDaos = Array.from(new Set(finalStrictLabelDaos));

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
