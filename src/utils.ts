import { createHash } from "crypto";

export const is_pure_number = (str: string | number) => {
  if (isNaN(Number(str))) {
    return false;
  } else {
    return true;
  }
};

export const define_property_on_object = (
  object: Object,
  property_key: string,
  value: any
) => {
  Object.defineProperty(object, property_key.trim(), {
    value,
    enumerable: true,
    writable: true,
  });
};

export function is_there_space_in_string(str: string) {
  const found_space = str.trim().includes(" ");
  if (found_space) {
    return true;
  } else {
    return false;
  }
}

// TODO : do not delete this function
export function extract_function_param_names(constructor: any) {
  const function_string = constructor.toString() as string;
  const argument = function_string.substring(
    function_string.indexOf("(") + 1,
    function_string.indexOf(")")
  );
  const params_names = argument.trim().split(",");
  return params_names.map((p) => p.trim());
}

export function is_two_array_intersect(
  arr_left: (string | number)[],
  arr_right: (string | number)[]
) {
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
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "bigint" ||
      typeof value === "function" ||
      typeof value === "symbol"
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
  try {
    if (
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "bigint" ||
      typeof value === "function" ||
      typeof value === "symbol"
    ) {
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
  if (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "bigint" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    return true;
  } else {
    return false;
  }
}

export function valueType(value: any) {
  if (isPrimitive(value)) {
    return "primitive";
  } else if (isArray(value)) {
    return "array";
  } else if (isObject(value)) {
    return "object";
  }
}

/**
 * Generate positional ref
 *
 */
export function generatePositionalRef(newArr: any[], newEle: any[]) {
  newEle.forEach((ele) => {
    const index = newArr.findIndex((val) => val.id === ele.id);
    const upperEleIndex = newArr[index - 1];
    ele.pRef = upperEleIndex === undefined ? null : upperEleIndex.id;
  });

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
  // if the value type of old data and new data is different then return new data
  if (valueType(oldData) !== valueType(newData)) {
    return newData;
  }

  // ok , value type of old data and new data is same
  // if the value type of old data is primitive then return new data
  if (valueType(oldData) === "primitive") {
    return newData;
  }

  // ok , value type of old data is not primitive now , so it is object or array

  // if the value type of old data is array
  if (valueType(oldData) === "array") {
    // this means new data is array also
    const isAllElementObjectFinalData = newData.every((element: any) => {
      return isObject(element);
    });

    const isAllElementObjectPrevData = oldData.every((element: any) => {
      return isObject(element);
    });

    // if the elements of both array are object then we can compare them
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

        newData.forEach((element: any) => {
          const found = oldData.filter(
            (prev_ele: any) => prev_ele[id] === element[id]
          );
          if (found.length === 0) {
            // this is new element
            element["nr"] = true;
            newElements.push(element);
          }
        });

        // attach the positional ref to new elements
        const referencedEle = generatePositionalRef(newData, newElements);

        const deletedElements: any[] = [];
        oldData.forEach((element: any) => {
          const found = newData.filter(
            (final_ele: any) => final_ele[id] === element[id]
          );
          if (found.length === 0) {
            // this is deleted element
            deletedElements.push({ dr: true, id: element[id] });
          }
        });

        const updatedElements: any[] = [];
        newData.forEach((element: any) => {
          const foundOld = oldData.find(
            (prev_ele: any) => prev_ele[id] === element[id]
          );
          if (foundOld) {
            // element is in old data
            // check for the difference as two objects
            const deltaObj = findDelta(foundOld, element, id);
            if (Object.keys(deltaObj).length !== 0) {
              // because if there is no difference then it will return empty object
              // hence we are checking for the length of object
              deltaObj[id] = element[id];
              deltaObj["nr"] = false; // indicates that this is not new element
              updatedElements.push(deltaObj);
            }
          }
        });

        return [...referencedEle, ...deletedElements, ...updatedElements];
      } else {
        return newData;
      }
    } else {
      // if the elements of both array are not object then we can not compare them
      // just return the new data
      // element of arr may be primitive or array ( multidimensional array )
      return newData;
    }
  }

  // if the value type of old data is object
  if (valueType(oldData) === "object") {
    // this means new data is object also
    // we are dealing with objects here
    // both object should have same keys
    // if the keys are same then we can compare them

    // merge the keys of both object to each other
    const { old_data, new_data } = mergeKeysOfObjects(oldData, newData);
    const deltaFinalObj: any = {};

    Object.keys(new_data).forEach((key) => {
      const oldValue = old_data[key];
      const newValue = new_data[key];

      // we need to recursively call this function to find the delta
      const delta = findDelta(oldValue, newValue, id);
      // if the delta is primitive
      if (valueType(delta) === "primitive" && delta !== oldValue) {
        deltaFinalObj[key] = delta;
      } else if (valueType(delta) === "primitive" && delta === oldValue) {
      } else if (valueType(delta) === "array") {
        deltaFinalObj[key] = delta;
      } else if (valueType(delta) === "object") {
        if (Object.keys(delta).length !== 0) {
          // if the delta is not empty object
          // then we need to add this key to deltaFinalObj
          // because there is change in the value of this key
          deltaFinalObj[key] = delta;
        }
      } else {
        deltaFinalObj[key] = delta;
      }
    });

    return deltaFinalObj;
  }

  return newData;
}

export function findNewValueFromDelta(oldValue: any, delta: any, id: string) {
  if (valueType(delta) !== valueType(oldValue)) {
    return delta;
  }

  // if the value is primitive then return the delta
  if (valueType(delta) === "primitive") {
    return delta;
  }

  // if the value is array
  if (valueType(delta) === "array") {
    const isAllElementObjects = oldValue.every((element: any) => {
      return isObject(element);
    });

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
        const allNewElements: any[] = delta.filter((element: any) => {
          return element.hasOwnProperty("nr") && element.nr === true;
        });

        const allDeleteElements: any[] = delta.filter((element: any) => {
          return element.hasOwnProperty("dr") && element.dr === true;
        });

        const allUpdatedElements: any[] = delta.filter((element: any) => {
          return element.hasOwnProperty("nr") && element.nr === false;
        });

        const newElements: any[] = [];

        // merge the new item at the proper position
        allNewElements.forEach((element: any) => {
          const ref = element.pRef;
          if (ref === null) {
            // push to the top of the array
            // delete the ref and nr key
            delete element.pRef;
            delete element.nr;
            oldValue.unshift(element);
          } else {
            // there is relation
            const indexOfRef = oldValue.findIndex(
              (ele: any) => ele[id] === ref
            );
            if (indexOfRef !== -1) {
              delete element.pRef;
              delete element.nr;
              // if the index is found then insert the element at that index
              oldValue = [
                ...oldValue.slice(0, indexOfRef + 1),
                element,
                ...oldValue.slice(indexOfRef + 1),
              ];
            }
          }
        });

        oldValue.forEach((element: any) => {
          const foundDeleted = allDeleteElements.find(
            (ele: any) => ele[id] === element[id]
          );
          if (!foundDeleted) {
            // this element is not deleted
            // check for the updated elements
            const foundUpdated = allUpdatedElements.find(
              (ele: any) => ele[id] === element[id]
            );
            if (foundUpdated) {
              // this element is updated
              // so we need to add this element to newElements
              delete foundUpdated.nr;
              // merge the old and updated element
              Object.keys(foundUpdated).forEach((uKey) => {
                const oldEleKeyVal = element[uKey];
                const newEleKeyVal = foundUpdated[uKey];
                const newValue = findNewValueFromDelta(
                  oldEleKeyVal,
                  newEleKeyVal,
                  id
                );
                element[uKey] = newValue;
              });
              newElements.push(element);
            } else {
              // this element is not updated
              // so we need to add this element to newElements
              newElements.push(element);
            }
          }
        });

        return newElements;
      } else {
        return delta;
      }
    } else {
      // delta elements is either primitive or array ( no change )
      return delta;
    }
  }

  if (valueType(delta) === "object") {
    // merge the keys of both object to each other
    const { old_data, new_data } = mergeMissingValues(oldValue, delta);
    const deltaFinalObj: any = {};

    Object.keys(new_data).forEach((key) => {
      // we need to recursively call this function to find the delta
      deltaFinalObj[key] = findNewValueFromDelta(
        old_data[key],
        new_data[key],
        id
      );
    });

    return deltaFinalObj;
  }

  return delta;
}

// generate the hash of the data
export function generateHash(
  clientInstanceUUID: string,
  databaseName: string,
  daoName: string,
  paramObject: any
) {
  const hash = createHash("sha256");
  hash.update(String(clientInstanceUUID));
  hash.update(databaseName);
  hash.update(daoName);
  hash.update(JSON.stringify(paramObject));
  return hash.digest("hex");
}

// is delta have value
// delta value will be either primitive , array , object
// ex -> 2 , { name : 'abc' } , [ { name : 'abc' } ] , [ 2 ] , [ something ]

export function isDeltaEmpty(delta: any) {
  if (isPrimitive(delta)) {
    return false;
  } else if (isArray(delta)) {
    return delta.length === 0;
  } else if (isObject(delta)) {
    return Object.keys(delta).length === 0;
  }
}

// remove duplicate values from array
export function removeDuplicateValuesFromArray<T>(
  array: T[],
  ...args: string[]
) {
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
  return (self: any, mutation: any) => true;
}
