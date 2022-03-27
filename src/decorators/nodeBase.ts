import { NodeConfig } from '../main-interface';

// create the class decorator
export function Node(config: NodeConfig) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T): T {
        return class extends constructor {
            constructor(...args: any[]) {
                super(args);
            }

            public nodeConfig: NodeConfig = config;
            public param_object: any = null;
        };
    };
}
