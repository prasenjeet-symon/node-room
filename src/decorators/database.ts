/**
 * This is class decorator
 * This help us create a database class for the node room
 */
export function Database() {
    return function <T extends { new (...args: any[]): {} }>(constructor: T): T {
        return class extends constructor {
            /**
             * Get the database
             */
            public getDatabaseName(): string {
                return this.constructor.name;
            }

            constructor(...args: any[]) {
                super(args);
            }

            public getDao = (daoName: string) => {
                const foundDao = (this as any)[daoName];
                if (foundDao) {
                    foundDao.prototype.database_name = this.getDatabaseName();
                    return foundDao;
                } else {
                    return undefined;
                }
            };
        };
    };
}
