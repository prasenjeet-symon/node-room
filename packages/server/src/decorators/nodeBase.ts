import { Label } from '../main-interface';

export function Node(labels: Label[] = []) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T): T {
        return class extends constructor {
            private isMutationNode!: boolean;
            private nodeName!: string;
            private isIDPresent!: boolean;
            private labels: Label[] = [];

            constructor(...args: any[]) {
                super(args);
                this.checkForRequiredMethods();
                this.checkForDuplicateMethods();
                this.checkForID();
                this.nodeName = constructor.name;
                this.isMutationNode = this.detectMutationNode();
                this.labels = labels;
            }

            /**
             *
             * Check for the ID in the node
             */
            private checkForID() {
                const methods = Object.getOwnPropertyNames(constructor.prototype);
                const isIDPresent = !!methods.find((val) => val === 'id');
                if (isIDPresent) {
                    this.isIDPresent = true;
                } else {
                    console.warn(`ID is not present in ${this.nodeName} node.`);
                }
            }

            /**
             * fetch method and mutate method is required
             * If not found throw error
             */
            private checkForRequiredMethods() {
                const methods = Object.getOwnPropertyNames(constructor.prototype);
                const isRequiredMethodsThere = !!methods.find((val) => val === 'mutate' || val === 'fetch');
                if (!isRequiredMethodsThere) {
                    throw new Error(`Required methods are missing. ${constructor.name} node must have fetch or mutate method.`);
                }

                if (!this.detectMutationNode()) {
                    // this is a fetch node
                    const isFetchMethod = !!methods.find((val) => val === 'fetch');
                    if (!isFetchMethod) {
                        throw new Error(`${constructor.name} node must have fetch method.`);
                    }
                }
            }

            /**
             * Fetch and mutate should not be present in the node at the same time
             */
            private checkForDuplicateMethods() {
                const methods = Object.getOwnPropertyNames(constructor.prototype);
                const isFetchMethod = !!methods.find((val) => val === 'fetch');
                const isMutateMethod = !!methods.find((val) => val === 'mutate');
                if (isFetchMethod && isMutateMethod) {
                    throw new Error(`${constructor.name} node cannot have both fetch and mutate methods.`);
                }
            }

            /**
             * Check if the node is a mutation node
             */
            private detectMutationNode() {
                const methods = Object.getOwnPropertyNames(constructor.prototype);
                const isMutateFunction = !!methods.find((val) => val === 'mutate');
                return isMutateFunction;
            }
        };
    };
}
