// create the method decorator called as TQuery

import { ConnectMysql } from '../MYSQL/connect-mysql';
import { extract_function_param_names } from '../utils';

export function TQuery() {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        const original_function = descriptor.value;
        /** Extract the "fetch" function param names */
        const param_names = extract_function_param_names(descriptor.value);

        /** Extend the "fetch" function with new body */
        descriptor.value = async function (...args: any[]) {
            const containing_class = this as any;
            const database_name: string = containing_class.database_name;

            // get the param_object from base class
            let param_object = containing_class.param_object;
            if (!param_object) {
                param_object = {};
                param_names.forEach((param_name, index) => {
                    if (args[index]) {
                        param_object[param_name] = args[index];
                    } else {
                        param_object[param_name] = undefined;
                    }
                });
            }
            containing_class.param_object = param_object;
            // we are in the tranaction dao
            // start the transaction
            const MYSQL = ConnectMysql.getInstance();
            const sqlQueryMaker = MYSQL.getSQLQueryMaker(database_name);
            await sqlQueryMaker.startTransaction();
            containing_class.sqlQueryMaker = sqlQueryMaker; // assign sqlQueryMaker to base class property

            try {
                const result = await original_function().apply(
                    this,
                    param_names.map((name) => param_object[name])
                );

                await sqlQueryMaker.commit();
                containing_class.flushChanges();
                return result;
            } catch (error: any) {
                await sqlQueryMaker.rollback();
                containing_class.clearChanges();
                throw new Error(error);
            }
        };

        return descriptor;
    };
}
