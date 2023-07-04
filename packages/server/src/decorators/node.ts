import { extract_function_param_names } from '../utils';

export function Query() {
    return function (_target: Object, _propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        /**
         * Extract the param names of the fetch function
         */
        const param_names = extract_function_param_names(descriptor.value);
        /**
         * Original fetch function body
         */
        const original_function = descriptor.value;
        /**
         * Extend the "fetch" function with new body
         * */
        descriptor.value = async function (...args: any[]) {
            /**
             * Extract the param value and associate it with proper param name
             * To construct the param object - { 'param_name' :'param_value' }
             */
            const containing_class = this as any;

            // get the param object from the parent class (base class) , if any
            let param_object = containing_class.param_object;
            if (!param_object) {
                param_object = {};
                param_names.forEach((param_name, index) => {
                    try {
                        param_object[param_name] = args[index];
                    } catch (error) {
                        param_object[param_name] = undefined;
                    }
                });
            }

            containing_class.param_object = param_object;

            return original_function.apply(
                this,
                param_names.map((name) => param_object[name])
            );
        };

        return descriptor;
    };
}
