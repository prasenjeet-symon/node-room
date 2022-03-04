import mysql from 'mysql2';

export const MYSQL_DATATYPE = {
    POINT: (SRID: number = 0) => {
        return `POINT`;
    },

    CHAR: (size: number = 1) => {
        if (size >= 0 && size <= 255 && is_pure_number(size)) {
            return `CHAR(${size})`;
        } else {
            new Error('CHAR DATATYPE size should be [0, 255]');
        }
    },

    VARCHAR: (size: number) => {
        if (size >= 0 && size <= 65535 && is_pure_number(size)) {
            return `VARCHAR(${size})`;
        } else {
            new Error('VARCHAR DATATYPE size should be [0, 65535]');
        }
    },

    TINYTEXT: `TINYTEXT`,

    TEXT: (size?: number) => {
        if (size) {
            if (size >= 0 && size <= 65535 && is_pure_number(size)) {
                return `TEXT(${size})`;
            } else {
                new Error('TEXT DATATYPE size should be [0, 65535]');
            }
        } else {
            return `TEXT`;
        }
    },

    MEDIUMTEXT: `MEDIUMTEXT`,

    LONGTEXT: `LONGTEXT`,

    ENUM: (enum_list: string[]) => {
        if (enum_list.length >= 1 && enum_list.length <= 65535) {
            return `ENUM( ${enum_list.map((p) => `'${p}'`).join(', ')})`;
        } else {
            new Error('ENUM DATATYPE size should be [0, 65535]');
        }
    },

    TINYINT: (signed: boolean = true) => {
        if (signed) {
            return `TINYINT`;
        } else {
            return `TINYINT UNSIGNED`;
        }
    },

    BOOL: `BOOL`,

    BOOLEAN: `BOOLEAN`,

    SMALLINT: (signed: boolean = true) => {
        if (signed) {
            return `SMALLINT`;
        } else {
            return `SMALLINT UNSIGNED`;
        }
    },

    MEDIUMINT: (signed: boolean = true) => {
        if (signed) {
            return `MEDIUMINT`;
        } else {
            return `MEDIUMINT UNSIGNED`;
        }
    },

    INT: (signed: boolean = true) => {
        if (signed) {
            return `INT`;
        } else {
            return `INT UNSIGNED`;
        }
    },

    BIGINT: (signed: boolean = true) => {
        if (signed) {
            return `BIGINT`;
        } else {
            return `BIGINT UNSIGNED`;
        }
    },

    FLOAT: (signed: boolean = true) => {
        if (signed) {
            return `FLOAT`;
        } else {
            return `FLOAT UNSIGNED`;
        }
    },

    DOUBLE: (signed: boolean = true) => {
        if (signed) {
            return `DOUBLE`;
        } else {
            return `DOUBLE UNSIGNED`;
        }
    },

    DATE: 'DATE',
    DATETIME: 'DATETIME',
    TIMESTAMP: 'TIMESTAMP',
    TIME: 'TIME',
    YEAR: 'YEAR',
};

export const is_pure_number = (str: string | number) => {
    if (isNaN(Number(str))) {
        return false;
    } else {
        return true;
    }
};

export const table_config_key = (class_name: string) => {
    return `${class_name.trim()}_table_config`;
};

export const define_property_on_object = (object: Object, property_key: string, value: any) => {
    Object.defineProperty(object, property_key.trim(), {
        value,
        enumerable: true,
        writable: true,
    });
};

export function parse_sql_string(value: any) {
    if (value === null || value === undefined || value === '' || value === 'NULL' || value === 'null') {
        return `NULL`;
    }

    // if the value is boolean
    if (typeof value === 'boolean') {
        return value ? `TRUE` : `FALSE`;
    }

    if (!is_pure_number(value)) {
        //pure string
        return `'${value.replace(new RegExp("'", 'ig'), "''")}'`;
    } else {
        return +value;
    }
}

export function is_there_space_in_string(str: string) {
    const found_space = str.trim().includes(' ');
    if (found_space) {
        return true;
    } else {
        return false;
    }
}

// TODO : do not delete this function
export function extract_function_param_names(constructor: any) {
    const function_string = constructor.toString() as string;
    const argument = function_string.substring(function_string.indexOf('(') + 1, function_string.indexOf(')'));
    const params_names = argument.trim().split(',');
    return params_names.map((p) => p.trim());
}

// TOOD: do not delete this function
export function detect_query_type(query: string) {
    const first_element = query.split(' ')[0];

    switch (first_element.toUpperCase()) {
        case 'SELECT':
            return 'SELECT';

        case 'UPDATE':
            return 'UPDATE';

        case 'DELETE':
            return 'DELETE';

        case 'INSERT':
            return 'INSERT';

        default:
            return 'UNKNOWN';
    }
}

export function is_two_array_intersect(arr_left: (string | number)[], arr_right: (string | number)[]) {
    let is_intersected = false;
    for (let index = 0; index < arr_left.length; index++) {
        if (arr_right.includes(arr_left[index])) {
            is_intersected = true;
            break;
        }
    }
    return is_intersected;
}

export function isObject(value: any) {
    try {
        if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
            return false;
        } else {
            if (value.length) {
                // array
                return false;
            } else {
                // possibly object
                return true;
            }
        }
    } catch (error) {
        return false;
    }
}

export function isArray(value: any) {
    try {
        if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
            return false;
        } else {
            if (value.length) {
                // array
                return true;
            } else {
                // possibly object
                return false;
            }
        }
    } catch (error) {
        return false;
    }
}

export function isPrimitive(value: any) {
    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
        return true;
    } else {
        return false;
    }
}

export function valueType(value: any) {
    if (isPrimitive(value)) {
        return 'primitive';
    } else if (isArray(value)) {
        return 'array';
    } else if (isObject(value)) {
        return 'object';
    }
}

// function to merge the property of new data and old data
export function mergeKeysOfObjects(old_data: any, new_data: any) {
    Object.keys(old_data).forEach((key) => {
        if (new_data[key] === undefined) {
            // there is no key in new data
            // create new one with same key and value equal to null
            new_data[key] = null;
        }
    });

    Object.keys(new_data).forEach((key) => {
        if (old_data[key] === undefined) {
            // there is no key in old data
            // create new one with same key and value equal to null
            old_data[key] = null;
        }
    });

    return { old_data, new_data };
}

// find the delta in database data

export function findDelta(prev_data: any, final_data: any) {
    if (valueType(prev_data) !== valueType(final_data)) {
        return { isDelta: true, data: final_data };
    }

    // value type of both prev and final data is same
    if (valueType(final_data) === 'primitive') {
        if (final_data !== prev_data) {
            return { isDelta: true, data: final_data };
        } else {
            return { isDelta: false, data: final_data };
        }
    }

    if (valueType(final_data) === 'array') {
        const isAllElementObjectFinalData = final_data.every((element: any) => {
            return isObject(element);
        });

        const isAllElementObjectPrevData = prev_data.every((element: any) => {
            return isObject(element);
        });

        if (isAllElementObjectFinalData && isAllElementObjectPrevData) {
            const isIdsFinalData = final_data.every((element: any) => {
                return element.hasOwnProperty('id');
            });

            const isIdsPrevData = prev_data.every((element: any) => {
                return element.hasOwnProperty('id');
            });

            if (isIdsFinalData && isIdsPrevData) {
                const newElements: any[] = [];

                final_data.forEach((element: any) => {
                    const found = prev_data.filter((prev_ele: any) => prev_ele.id === element.id);
                    if (found.length === 0) {
                        // new element
                        element['NR_new'] = true;
                        newElements.push(element);
                    }
                });

                const deletedElements: any[] = [];
                // deleted one
                prev_data.forEach((element: any) => {
                    const found = final_data.filter((final_ele: any) => final_ele.id === element.id);
                    if (found.length === 0) {
                        // deleted element
                        deletedElements.push({ id: element.id, NR_deleted: true });
                    }
                });

                const updatedElements: any[] = [];

                final_data.forEach((element: any) => {
                    const found = (prev_data as any[]).find((prev_ele: any) => prev_ele.id === element.id);
                    if (found) {
                        // found element
                        const deltaObj = findDelta(found, element);
                        if (Object.keys(deltaObj).length !== 0) {
                            deltaObj['id'] = element.id;
                            deltaObj['NR_new'] = false;

                            updatedElements.push(deltaObj);
                        }
                    }
                });

                return [...newElements, ...deletedElements, ...updatedElements];

                // code
            } else {
                return { isDelta: true, data: final_data };
            }
        } else {
            return { isDelta: true, data: final_data };
        }
    }

    if (valueType(final_data) === 'object') {
        // both old and new data are object
        const { old_data, new_data } = mergeKeysOfObjects(prev_data, final_data);
        const deltaFinalObj: any = {};

        Object.keys(new_data).forEach((key: any) => {
            const newDataValue = new_data[key];
            const oldDataValue = old_data[key];

            const deltaObj = findDelta(oldDataValue, newDataValue);

            //deltaObj can be of type primitive, array , object
            if (deltaObj.hasOwnProperty('isDelta')) {
                if (deltaObj.isDelta) {
                    deltaFinalObj[key] = deltaObj.data;
                }
            } else if (valueType(deltaObj) === 'object') {
                if (Object.keys(deltaObj).length !== 0) {
                    deltaFinalObj[key] = deltaObj;
                }
            } else if (valueType(deltaObj) === 'array') {
                deltaFinalObj[key] = deltaObj;
            }
        });

        return deltaFinalObj;
    }
}

// standalone function to connect to database
export function connectToDatabase() {
    return new Promise<mysql.Connection>((resolve, reject) => {
        const connection = mysql.createConnection({
            user: process.env.MYSQL_USER,
            host: process.env.MYSQL_HOST || 'localhost',
            password: process.env.MYSQL_PASSWORD || '',
            port: Number(process.env.MYSQL_PORT) || 3306,
            multipleStatements: true,
        });

        connection.connect((err) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });
}

// create new database for the connection to complete
export async function createNewDatabase(databaseName: string) {
    const connection = await connectToDatabase();
    // SQL query to create database if not exists
    const sql = `CREATE DATABASE IF NOT EXISTS ${databaseName}`;
    await new Promise<void>((resolve, reject) => {
        connection.query(sql, (err, results) => {
            if (err) {
                connection.end();
                reject(err);
            } else {
                connection.end();
                resolve();
            }
        });
    });
}
