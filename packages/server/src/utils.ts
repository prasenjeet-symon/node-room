import { createHash } from 'crypto';
import { NodeType } from './main-interface';
import { DownStreamManager } from './network/downstream-manager';

export const is_pure_number = (str: string | number) => {
    if (isNaN(Number(str))) {
        return false;
    } else {
        return true;
    }
};

export const define_property_on_object = (object: Object, property_key: string, value: any) => {
    Object.defineProperty(object, property_key.trim(), {
        value,
        enumerable: true,
        writable: true,
    });
};

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
        if (
            typeof value === 'boolean' ||
            typeof value === 'number' ||
            typeof value === 'string' ||
            typeof value === 'bigint' ||
            typeof value === 'function' ||
            typeof value === 'symbol'
        ) {
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
    return Array.isArray(value);
}

export function isPrimitive(value: any) {
    if (
        typeof value === 'boolean' ||
        typeof value === 'number' ||
        typeof value === 'string' ||
        typeof value === 'bigint' ||
        typeof value === 'function' ||
        typeof value === 'symbol'
    ) {
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
    }else{
        return 'primitive';
    }
}

/**
 * Generate positional ref
 *
 */
export function generatePositionalRef(newArr: any[], newEle: any[], id: string) {
    for (const ele of newEle) {
        const index = newArr.findIndex((val) => val[id] === ele[id]);
        const upperEleIndex = newArr[index - 1];
        ele['pRef'] = upperEleIndex === undefined ? null : upperEleIndex[id];
    }

    return newEle;
}

export function mergeKeysOfObjects(old_data: any, new_data: any) {
    Object.keys(old_data).forEach((key) => {
        if (!new_data.hasOwnProperty(key)) {
            new_data[key] = null;
        }
    });

    Object.keys(new_data).forEach((key) => {
        if (!old_data.hasOwnProperty(key)) {
            old_data[key] = null;
        }
    });

    return {
        old_data,
        new_data,
    };
}

export function mergeMissingValues(old_data: any, new_data: any) {
    Object.keys(new_data).forEach((key) => {
        if (!old_data.hasOwnProperty(key)) {
            old_data[key] = new_data[key];
        }
    });

    Object.keys(old_data).forEach((key) => {
        if (!new_data.hasOwnProperty(key)) {
            new_data[key] = old_data[key];
        }
    });

    return {
        old_data,
        new_data,
    };
}

export function findDelta(oldData: any, newData: any, id: string) {
    if (valueType(oldData) !== valueType(newData)) {
        return newData;
    }

    if (valueType(oldData) === 'primitive') {
        return newData;
    }

    if (valueType(oldData) === 'array') {
        const isAllElementObjectFinalData = newData.every((element: any) => {
            return isObject(element);
        });

        const isAllElementObjectPrevData = oldData.every((element: any) => {
            return isObject(element);
        });

        if (isAllElementObjectFinalData && isAllElementObjectPrevData) {
            // every elements of both array should contain id as provided in id param
            const isIdsFinalData = newData.every((element: any) => {
                return element.hasOwnProperty(id);
            });

            const isIdsPrevData = oldData.every((element: any) => {
                return element.hasOwnProperty(id);
            });

            if (isIdsFinalData && isIdsPrevData) {
                const newElements: any[] = [];

                for (const element of newData) {
                    const found = oldData.find((oldElement: any) => oldElement[id] === element[id]);
                    if (!found) {
                        // this is new element
                        // nr -> new row
                        element['nr'] = true;
                        newElements.push(element);
                    }
                }

                // attach the positional ref to new elements
                const referencedEle = generatePositionalRef(newData, newElements, id);

                const deletedElements: any[] = [];
                for (const element of oldData) {
                    const found = newData.find((newElement: any) => newElement[id] === element[id]);
                    if (!found) {
                        // this is deleted element
                        // dr -> deleted row
                        deletedElements.push({ dr: true, [id]: element[id] });
                    }
                }

                const updatedElements: any[] = [];
                for (const element of newData) {
                    const foundOld = oldData.find((oldElement: any) => oldElement[id] === element[id]);
                    if (foundOld) {
                        // element is in old data
                        // check for the difference as two objects
                        const deltaObj = findDelta(foundOld, element, id);
                        if (Object.keys(deltaObj).length !== 0) {
                            // because if there is no difference then it will return empty object
                            // hence we are checking for the length of object
                            deltaObj[id] = element[id];
                            deltaObj['nr'] = false; // indicates that this is not new element
                            updatedElements.push(deltaObj);
                        }
                    }
                }

                return [...referencedEle, ...deletedElements, ...updatedElements];
            } else {
                return newData;
            }
        } else {
            return newData;
        }
    }

    // if the value type of old data is object
    if (valueType(oldData) === 'object') {
        // this means new data is object also
        // we are dealing with objects here
        // both object should have same keys
        // if the keys are same then we can compare them

        // merge the keys of both object to each other
        const { old_data, new_data } = mergeKeysOfObjects(oldData, newData);
        const deltaFinalObj: any = {};

        for (const key of Object.keys(new_data)) {
            const oldValue = old_data[key];
            const newValue = new_data[key];

            // we need to recursively call this function to find the delta
            const delta = findDelta(oldValue, newValue, id);
            // if the delta is primitive
            if (valueType(delta) === 'primitive' && delta !== oldValue) {
                deltaFinalObj[key] = delta;
            } else if (valueType(delta) === 'primitive' && delta === oldValue) {
            } else if (valueType(delta) === 'array') {
                deltaFinalObj[key] = delta;
            } else if (valueType(delta) === 'object') {
                if (Object.keys(delta).length !== 0) {
                    // if the delta is not empty object
                    // then we need to add this key to deltaFinalObj
                    // because there is change in the value of this key
                    deltaFinalObj[key] = delta;
                }
            } else {
                deltaFinalObj[key] = delta;
            }
        }

        return deltaFinalObj;
    }

    return newData;
}

/**
 * This function support three data type -> primitive , array and object
 * Primitive value as supported by the JSON
 */
export function findNewValueFromDelta(oldValue: any, delta: any, id: string) {
    // if we are receiving the different data type then just return the new value ( delta )
    if (valueType(delta) !== valueType(oldValue)) {
        return delta;
    }

    // if the value is primitive then return the delta
    if (valueType(delta) === 'primitive') {
        return delta;
    }

    // if the value is array
    if (valueType(delta) === 'array') {
        // check if all the elements of the array is object or not
        // old value
        const isAllElementObjects = oldValue.every((element: any) => {
            return isObject(element);
        });

        // check if all the elements of the array is object or not
        // delta value
        const isAllElementObjectDelta = delta.every((element: any) => {
            return isObject(element);
        });

        if (isAllElementObjects && isAllElementObjectDelta) {
            const isOldEleIds = oldValue.every((element: any) => {
                return element.hasOwnProperty(id);
            });

            const isNewEleIds = delta.every((element: any) => {
                return element.hasOwnProperty(id);
            });

            if (isOldEleIds && isNewEleIds) {
                // delta consist of three mutation type ( create , update and delete )
                const allNewElements: any[] = delta.filter((element: any) => {
                    return element.hasOwnProperty('nr') && element.nr === true;
                });

                const allDeleteElements: any[] = delta.filter((element: any) => {
                    return element.hasOwnProperty('dr') && element.dr === true;
                });

                const allUpdatedElements: any[] = delta.filter((element: any) => {
                    return element.hasOwnProperty('nr') && element.nr === false;
                });

                const newElements: any[] = [];
                // merge the new item at the proper positions
                for (const element of allNewElements) {
                    // if this is creation row then it must contain pRef with value equal to 'id' or null
                    const ref = element.pRef;
                    if (!ref) {
                        // there should be no row on top of this row
                        // push to the top of the array
                        // delete the ref and nr key generated by the node room
                        delete element.pRef;
                        delete element.nr;
                        oldValue.unshift(element);
                    } else {
                        const indexOfRef = oldValue.findIndex((ele: any) => ele[id] === ref);
                        if (indexOfRef !== -1) {
                            delete element.pRef;
                            delete element.nr;
                            // if the index is found then insert the element at that index
                            oldValue.splice(indexOfRef + 1, 0, element);
                        }
                    }
                }

                // merge the update delta and delete delta
                for (const element of oldValue) {
                    const foundDeleted = allDeleteElements.find((ele: any) => ele[id] === element[id]);
                    if (!foundDeleted) {
                        // this row is not deleted
                        // check for the update
                        const foundUpdated = allUpdatedElements.find((ele: any) => ele[id] === element[id]);
                        if (foundUpdated) {
                            // this row is updated
                            // so we need to add this element to newElements
                            delete foundUpdated.nr;
                            // merge the old and updated properties of the updated row
                            for (const uKey of Object.keys(foundUpdated)) {
                                const oldEleKeyVal = element[uKey];
                                const newEleKeyVal = foundUpdated[uKey];
                                const newValue = findNewValueFromDelta(oldEleKeyVal, newEleKeyVal, id);
                                element[uKey] = newValue;
                            }

                            newElements.push(element);
                        } else {
                            // this row is not updated
                            // so we need to add this element as it is to the final array
                            newElements.push(element);
                        }
                    }
                }

                return newElements;
            } else {
                // delta's elements are not collections of rows
                // just return the delta as latest value
                return delta;
            }
        } else {
            // delta's elements are not collections of rows
            // just return the delta as latest value
            return delta;
        }
    }

    if (valueType(delta) === 'object') {
        // merge the keys of both object to each other
        const { old_data, new_data } = mergeMissingValues(oldValue, delta);
        const deltaFinalObj: any = {};

        for (const key of Object.keys(new_data)) {
            deltaFinalObj[key] = findNewValueFromDelta(old_data[key], new_data[key], id);
        }

        return deltaFinalObj;
    }

    return delta;
}

// generate the hash of the data
export function generateHash(clientInstanceUUID: string, databaseName: string, daoName: string, paramObject: any) {
    const hash = createHash('sha256');
    hash.update(String(clientInstanceUUID));
    hash.update(databaseName);
    hash.update(daoName);
    hash.update(JSON.stringify(paramObject));
    return hash.digest('hex');
}

// is delta have value
// delta value will be either primitive , array , object
// ex -> 2 , { name : 'abc' } , [ { name : 'abc' } ] , [ 2 ] , [ something ]

export function isDeltaEmpty(delta: any) {
    if (isPrimitive(delta)) {
        return false;
    } else if (isArray(delta)) {
        return false;
    } else if (isObject(delta)) {
        return Object.keys(delta).length === 0;
    }else{
        return true
    }
}

// remove duplicate values from array
export function removeDuplicateValuesFromArray<T>(array: T[], ...args: string[]) {
    return array.filter((value: any, index: number, self: any[]) => {
        return (
            self.findIndex((ele: any) => {
                return args.every((key: string) => {
                    return ele[key] === value[key];
                });
            }) === index
        );
    });
}

// Helper functions
export function nTrue() {
    return (self: any, mutation: any, type: NodeType) => true;
}

export function generateHASH(digestStr: string[]) {
    const hash = createHash('sha256');
    digestStr.forEach((str) => {
        hash.update(str);
    });

    return hash.digest('hex');
}

// close the node room
export function closeNodeRoom() {
    DownStreamManager.getInstance().removeAllDownStreamClient();
}
