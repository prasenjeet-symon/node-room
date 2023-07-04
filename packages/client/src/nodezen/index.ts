import { isNode } from '../utils';

declare const require: any;

export class NodeZen {
    constructor(private nodeRoomType: string) {
        this.patchTypes();
    }

    public patchTypes() {
        console.log('will patch');
        // check if we are on nodejs
        if (isNode()) {
            console.log('will patch node');
            // import the fs
            const fs = require('fs');
            fs.writeFileSync(
                `./node-room.d.ts`,
                `declare module 'node-room' {
                 ${this.nodeRoomType}
                }`,
            );
        }
    }
}
