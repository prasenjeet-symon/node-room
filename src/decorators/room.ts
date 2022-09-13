/**
 * This is class decorator
 * This help us create a database class for the node room
 */
export function Room(name: string) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T): T {
        return class extends constructor {
            constructor(...args: any[]) {
                super(args);
            }

            public getRoomName(): string {
                return name || (this as any).constructor.name;
            }

            public getNode(nodeName: string) {
                const foundNode = (this as any)[nodeName];
                if (foundNode) {
                    foundNode.prototype.roomName = this.getRoomName();
                    return foundNode;
                } else {
                    return undefined;
                }
            }
        };
    };
}
