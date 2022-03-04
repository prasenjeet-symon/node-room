export function Database(config: { Tables: any[] }) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T): T {
        return class extends constructor {
            // get the class name
            private getDatabaseName(): string {
                return this.constructor.name;
            }

            constructor(...agrs: any[]) {
                super(agrs);
            }

            private get_all_tables = () => {
                return config.Tables.map((p) => p.entity);
            };

            private allTableCreationQuery = () => {
                return config.Tables.map((table_class) => {
                    const table_creation_command = new table_class().generateTableQuery();
                    return table_creation_command;
                }).join(' ');
            };

            private getDao = (dao_name: string) => {
                const found_dao = (this as any)[dao_name];
                if (found_dao) {
                    found_dao.prototype.database_name = this.getDatabaseName();
                    return found_dao;
                } else {
                    return undefined;
                }
            };
        };
    };
}
