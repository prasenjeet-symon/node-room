import { extract_function_param_names } from '../utils';

export function CQuery() {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        const original_function = descriptor.value;

        /** Extract the "fetch" function param names */
        const param_names = extract_function_param_names(descriptor.value);

        descriptor.value = async function (...args: any[]) {
            const containing_class = this as any; // this class with base class too
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

            // run the original function
            const resultDao = await original_function.apply(
                this,
                param_names.map((name) => param_object[name])
            );

            // try to cache the result and dao
            containing_class.cacheSelect(resultDao);

            return resultDao;
        };

        return descriptor;
    };
}
