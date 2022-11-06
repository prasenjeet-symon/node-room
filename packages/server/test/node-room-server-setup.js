const express = require('express');
// for server node apps
// const NodeEnvironment = require('jest-environment-node');
// for browser js apps
const NodeEnvironment = require('jest-environment-jsdom');

class NodeRoomEnvironment extends NodeEnvironment {
    constructor(config, context) {
        super(config, context);
    }

    async setup() {
        await super.setup();
        let server;
        const app = express();
        app.use(cors({ origin: '*' }));
        app.use(express.json());

        await new Promise(function (resolve) {
            server = app.listen(0, '127.0.0.1', function () {
                let address = server.address();
                console.log(` Running server on '${JSON.stringify(address)}'...`);
                resolve();
            });
        });
        let address = server.address();
        this.global.server = server;
        this.global.address = `${address.address}:${address.port}`;
    }

    async teardown() {
        this.global.server.close();
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }
}

module.exports = NodeRoomEnvironment;
