import { DaoConfig } from '../main-interface';

// create the class decorator
export function Dao(config: DaoConfig) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T): T {
        return class extends constructor {
            constructor(...args: any[]) {
                super(args);
            }

            public daoConfig: DaoConfig = config;
            public param_object: any = null;
        };
    };
}
