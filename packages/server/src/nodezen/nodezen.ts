import { extract_function_param_names } from '../utils';

/**
 * Type of node
 */
export type NodeTypeReturn = [() => string, (value: any) => boolean];
export type NodeType = (isOptional?: boolean, defaultValue?: any, validator?: (value: any) => boolean) => NodeTypeReturn;

/**
 * Create a string type of the node with optional parameters
 * @param isOptional - Whether the string is optional (default: true)
 * @param defaultValue - Default value of the string (default: '')
 * @param validator - Function to validate the string (default: always returns true)
 * @returns An array containing a function that returns the string type and a function to validate the string
 */
export function nrString(isOptional: boolean = true, defaultValue: string = '', validator: (value: any) => boolean = (value: any) => true): NodeTypeReturn {
    /**
     * Get the string type
     * @returns The string type
     */
    const fType = () => {
        return 'string';
    };

    /**
     * Validate the string value
     * @param value - The value to validate
     * @returns Whether the value is valid
     */
    const validate = (value: any) => {
        return validator(value);
    };

    return [fType, validate];
}
/**
 *
 *
 *
 *
 *
 */
/**
 * Create the number type of the node
 * @param isOptional - Whether the number is optional (default: true)
 * @param defaultValue - Default value of the number (default: 0)
 * @param validator - Function to validate the number (default: always returns true)
 * @returns An array containing a function that returns the number type and a function to validate the number
 *
 */
export function nrNumber(isOptional: boolean = true, defaultValue: number = 0, validator: (value: any) => boolean = (value: any) => true): NodeTypeReturn {
    /**
     * Get the number type
     * @returns The number type
     */
    const fType = () => {
        return 'number';
    };

    /**
     * Validate the number value
     *
     * @param value - The value to validate
     * @returns Whether the value is valid
     * */
    const validate = (value: any) => {
        return validator(value);
    };

    return [fType, validate];
}
/**
 *
 *
 *
 *
 *
 */
/**
 * Create the boolean type of the node
 * @param isOptional - Whether the boolean is optional (default: true)
 * @param defaultValue - Default value of the boolean (default: false)
 * @param validator - Function to validate the boolean (default: always returns true)
 * @returns An array containing a function that returns the boolean type and a function to validate the boolean
 *
 */
export function nrBoolean(isOptional: boolean = true, defaultValue: boolean = false, validator: (value: any) => boolean = (value: any) => true): NodeTypeReturn {
    /**
     * Get the boolean type
     * @returns The boolean type
     */
    const fType = () => {
        return 'boolean';
    };

    /**
     * Validate the boolean value
     * @param value - The value to validate
     * @returns Whether the value is valid
     * */
    const validate = (value: any) => {
        return validator(value);
    };

    return [fType, validate];
}
/**
 *
 *
 *
 *
 *
 */
/**
 * Create the array of given type of the node
 * @param isOptional - Whether the array is optional (default: true)
 * @param defaultValue - Default value of the array (default: [])
 * @param validator - Function to validate the array (default: always returns true)
 * @param type - The type of the array
 * @returns An array containing a function that returns the array type and a function to validate the array
 *
 */
export function nrArray(type: NodeTypeReturn, isOptional: boolean = true, defaultValue: any[] = [], validator: (value: any) => boolean = (value: any) => true): NodeTypeReturn {
    /**
     * Get the array type
     * @returns The array type
     */
    const fType = () => {
        // if (type.name === 'nrArray') {
        //     const typeF = type as typeof nrArray;
        //     return `${typeF(type)}[]`;
        // } else {
        //     const typeF = type as NodeType;
        //     return `${typeF()[0]()}[]`;
        // }
        return `${type[0]()}[]`;
    };

    /**
     * Validate the array value
     * @param value - The value to validate
     * @returns Whether the value is valid
     * */
    const validate = (value: any) => {
        return validator(value);
    };

    return [fType, validate];
}

/**
 *
 *
 *
 *
 *
 */
/**
 * Create the object of given type of the node
 * @param isOptional - Whether the object is optional (default: true)
 * @param defaultValue - Default value of the object (default: {})
 * @param validator - Function to validate the object (default: always returns true)
 * @returns An array containing a function that returns the object type and a function to validate the object
 */
export function nrObject(
    map: { [key: string]: NodeTypeReturn },
    isOptional: boolean = true,
    defaultValue: any = {},
    validator: (value: any) => boolean = (value: any) => true,
): NodeTypeReturn {
    /**
     * Get the object type
     * @returns The object type
     */
    const fType = () => {
        return `{
        ${Object.keys(map).map((key) => {
            const typeF = map[key];
            return `${key}: ${typeF[0]()}`;
        })}
        }`;
    };

    /**
     * Validate the object value
     * @param value - The value to validate
     * @returns Whether the value is valid
     * */
    const validate = (value: any) => {
        return validator(value);
    };

    return [fType, validate];
}

/**
 *
 *
 *
 *
 */
/**
 * Param type
 * param decorator
 *
 */
export function nrParam(...nrTypes: NodeTypeReturn[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        /**
         * Extract the param names of the fetch function
         */
        const param_names = extract_function_param_names(descriptor.value);

        if (param_names.length !== nrTypes.length) {
            throw new Error('The number of param names does not match the number of param types');
        }

        // we need to form { [key:string]: NodeTypeReturn }
        const map: { [key: string]: NodeTypeReturn } = {};

        param_names.forEach((param_name, index) => {
            map[param_name] = nrTypes[index];
        });

        const nrParamType = () => {
            return `
            ${Object.keys(map).map((key) => {
                const typeF = map[key];
                return `${key}: ${typeF[0]()}`;
            }).join(", ")}
            `;
        };

        target.constructor.prototype.nrParamType = nrParamType;

        const original_function = descriptor.value;
        // add this as new method to the class
        descriptor.value = async function (...args: any[]) {
            return original_function.apply(this, args);
        };

        return descriptor;
    };
}
/**
 *
 * Node room return type
 */
export function nrReturn(nrType: NodeTypeReturn) {
    // this decorator is located after the param decorator
    // hence we can use all the methods from the param decorator
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        const fReturnType = () => {
            // remove any ";" from the type that may be located in the last
            return nrType[0]().replace(/;$/, '');
        };

        target.constructor.prototype.fReturnType = fReturnType;

        // Given the nodeName of the node return the node param type and return type
        const nodeTypes = (nodeName: string) => {
            // nodeName: ( paramType ) : returnType
            const paramType = target.constructor.prototype.nrParamType();
            const returnType = target.constructor.prototype.fReturnType();

            return `
            ${nodeName}: {
                call: (${paramType}) => ${returnType};
            };`;
        };

        target.constructor.prototype.nodeTypes = nodeTypes;

        const original_function = descriptor.value;
        // add this as new method to the class
        descriptor.value = async function (...args: any[]) {
            return original_function.apply(this, args);
        };

        return descriptor;
    };
}
