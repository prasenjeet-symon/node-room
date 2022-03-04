import { SQLQueryMaker } from '../MYSQL/connect-mysql';
import { SqlCreateQueryRunner } from '../sql-query-runners/sql-create-runner';
import { SqlDeleteQueryRunner } from '../sql-query-runners/sql-delete-runner';
import { SqlSelectQueryRunner } from '../sql-query-runners/sql-select-runner';
import { SqlUpdateQueryRunner } from '../sql-query-runners/sql-update-runner';
import { detect_query_type, extract_function_param_names, parse_sql_string } from '../utils';

export function Query(query: string) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        if (!query) {
            throw new Error(`Query is required for the method - '${propertyKey}' in the dao - '${target.constructor.name}'`);
        }
        /**
         * Replace the new line with single space in the incoming SQL query
         */
        query = query.replace(new RegExp('\\n', 'ig'), ' ');
        // replace the multiple spaces with single space
        query = query.replace(new RegExp('\\s+', 'ig'), ' ');
        // trim the query
        query = query.trim();

        /** Extract the "fetch" function param names */
        const param_names = extract_function_param_names(descriptor.value);

        /** Detect the incoming query type - 'SELECT' | 'DELETE' | 'UPDATE' | 'INSERT' */
        const query_type = detect_query_type(query);

        // if the query type is UNKNOWN then throw an error
        if (query_type === 'UNKNOWN') {
            throw new Error(`Unknown query type for the query - '${query}' in the dao - '${target.constructor.name}'`);
        }

        const original_function = descriptor.value;

        /** Extend the "fetch" function with new body */
        descriptor.value = async function (...args: any[]) {
            /**
             * Extract the param value and associate it with proper param name
             * To construct the param object - { 'param_name' :'param_value' }
             */
            const containing_class = this as any;

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

            let modified_query: string = query;
            Object.keys(param_object).forEach((param_name, i) => {
                if (typeof param_object[param_name] === 'object') {
                    modified_query = modified_query.replace(new RegExp(`:${param_name}:`, 'ig'), param_object[param_name].map((p: any) => parse_sql_string(p)).join(', ') as string);
                } else {
                    modified_query = modified_query.replace(new RegExp(`:${param_name}:`, 'ig'), parse_sql_string(param_object[param_name]) as string);
                }
            });

            if (containing_class.env) {
                // this normal dao is inside parent dao ( compute or transaction )
                // we need to use the database of the parent dao
                containing_class.database_name = containing_class.env.database_name;
            }

            const database_name: string = containing_class.database_name;
            let finalResult: any;

            containing_class.query_type = query_type

            switch (query_type) {
                case 'SELECT':
                    await (async () => {
                        let result;

                        // fetch the data from the database
                        if (containing_class.env && containing_class.env.dao_type === 'transaction') {
                            // parent dao is a transaction dao
                            const sqlQueryMaker = containing_class.env.sqlQueryMaker as SQLQueryMaker;
                            const sqlSelectQueryRunner = new SqlSelectQueryRunner();
                            result = await sqlSelectQueryRunner.runByTransaction(modified_query, database_name, sqlQueryMaker);
                        } else {
                            // parent dao is not a transaction dao
                            // it can be compute or undefined ( no parent dao )
                            const sqlSelectQueryRunner = new SqlSelectQueryRunner();
                            result = await sqlSelectQueryRunner.run(modified_query, database_name);
                        }

                        result = { type: 'S', tables: result.tables, data: result.results };

                        // if the parent is compute and that dao is being run by client, we can cache select queries
                        if (containing_class.env && containing_class.env.dao_type === 'compute') {
                            if (containing_class.env.requested_by === 'client') {
                                containing_class.env.pushDaoResult(result);
                            }
                        }

                        if (containing_class.env === undefined) {
                            // no parent influence
                            if (containing_class.requested_by === 'client') {
                                containing_class.cacheSelect(result);
                            }
                        }

                        finalResult = result.data;
                    })();
                    break;

                case 'DELETE':
                    await (async () => {
                        let result;

                        // delete the data from the database
                        if (containing_class.env && containing_class.env.dao_type === 'transaction') {
                            // parent dao is a transaction dao
                            const sqlQueryMaker = containing_class.env.sqlQueryMaker as SQLQueryMaker;
                            const sqlDeleteQueryRunner = new SqlDeleteQueryRunner();
                            result = await sqlDeleteQueryRunner.runByTransaction(modified_query, database_name, sqlQueryMaker);
                        } else {
                            // parent dao is not a transaction dao
                            // it can be compute or undefined ( no parent dao )
                            const sqlDeleteQueryRunner = new SqlDeleteQueryRunner();
                            result = await sqlDeleteQueryRunner.run(modified_query, database_name);
                        }

                        result = { type: 'D', tables: result.tables, data: result.results };

                        // if the parent is compute and that dao is being run by client, add the dao type to the compute dao
                        if (containing_class.env && containing_class.env.dao_type === 'compute') {
                            if (containing_class.env.requested_by === 'client') {
                                containing_class.env.pushDaoResult(result);
                            }
                        }

                        // emit the change event
                        if (containing_class.env && containing_class.env.dao_type === 'transaction') {
                            containing_class.env.addChanges(result);
                        }

                        if (containing_class.env && containing_class.env.dao_type === 'compute') {
                            containing_class.emitChange(result);
                        }

                        if (containing_class.env === undefined) {
                            containing_class.emitChange(result);
                        }

                        finalResult = result.data;
                    })();
                    break;

                case 'UPDATE':
                    await (async () => {
                        let result;

                        // update the data in the database
                        if (containing_class.env && containing_class.env.dao_type === 'transaction') {
                            // parent dao is a transaction dao
                            const sqlQueryMaker = containing_class.env.sqlQueryMaker as SQLQueryMaker;
                            const sqlUpdateQueryRunner = new SqlUpdateQueryRunner();
                            result = await sqlUpdateQueryRunner.runByTransaction(modified_query, database_name, sqlQueryMaker);
                        } else {
                            // parent dao is not a transaction dao
                            // it can be compute or undefined ( no parent dao )
                            const sqlUpdateQueryRunner = new SqlUpdateQueryRunner();
                            result = await sqlUpdateQueryRunner.run(modified_query, database_name);
                        }

                        result = { type: 'U', tables: result.tables, data: result.results };

                        // if the parent is compute and that dao is being run by client, add the dao type to the compute dao
                        if (containing_class.env && containing_class.env.dao_type === 'compute') {
                            if (containing_class.env.requested_by === 'client') {
                                containing_class.env.pushDaoResult(result);
                            }
                        }

                        // emit the change event
                        if (containing_class.env && containing_class.env.dao_type === 'transaction') {
                            containing_class.env.addChanges(result);
                        }

                        if (containing_class.env && containing_class.env.dao_type === 'compute') {
                            containing_class.emitChange(result);
                        }

                        if (containing_class.env === undefined) {
                            containing_class.emitChange(result);
                        }

                        finalResult = result.data;
                    })();
                    break;

                case 'INSERT':
                    await (async () => {
                        let result;

                        // insert the data in the database
                        if (containing_class.env && containing_class.env.dao_type === 'transaction') {
                            // parent dao is a transaction dao
                            const sqlQueryMaker = containing_class.env.sqlQueryMaker as SQLQueryMaker;
                            const sqlInsertQueryRunner = new SqlCreateQueryRunner();
                            result = await sqlInsertQueryRunner.runByTransaction(modified_query, database_name, sqlQueryMaker);
                        } else {
                            // parent dao is not a transaction dao
                            // it can be compute or undefined ( no parent dao )
                            const sqlInsertQueryRunner = new SqlCreateQueryRunner();
                            result = await sqlInsertQueryRunner.run(modified_query, database_name);
                        }

                        result = { type: 'I', tables: result.tables, data: result.results };

                        // if the parent is compute and that dao is being run by client, add the dao type to the compute dao
                        if (containing_class.env && containing_class.env.dao_type === 'compute') {
                            if (containing_class.env.requested_by === 'client') {
                                // parent class is a compute dao and being run by client
                                containing_class.env.pushDaoResult(result);
                            }
                        }

                        // emit the change event
                        if (containing_class.env && containing_class.env.dao_type === 'transaction') {
                            // parent class is a transaction dao
                            // que the changes to the transaction dao
                            containing_class.env.addChanges(result);
                        }

                        if (containing_class.env && containing_class.env.dao_type === 'compute') {
                            // parent class is a compute dao
                            containing_class.emitChange(result);
                        }

                        if (containing_class.env === undefined) {
                            containing_class.emitChange(result);
                        }

                        finalResult = result.data;
                    })();
                    break;

                default:
                    throw new Error(`Unknown query type for the query - '${query}' in the dao - '${target.constructor.name}'`);
            }

            containing_class.DBData = finalResult;

            return original_function.apply(
                this,
                param_names.map((name) => param_object[name])
            );
        };

        return descriptor;
    };
}
