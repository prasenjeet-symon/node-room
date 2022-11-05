import eventSource from 'eventsource';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { fetchNode, NodeJsConfig, NodeResult, nodeRoomBootstrap } from 'node-room-client';
import { Subscription } from 'rxjs';
import { closeNodeRoom } from '../src/utils';
import { NODE_APP } from './test-applications/todo-application';
const fetch = require('node-fetch');

const MUTATION_TIMEOUT = 10000;
const QUERY_TIMEOUT = 2000;

const isPureNetworkLoaded = (result: NodeResult) => {
    return !result.isLocal && result.status === 'loaded';
};

const delayExecution = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const failErrorAfterTimeout = (ms: number) => {
    return setTimeout(() => {
        throw new Error('Timeout');
    }, ms);
};

export const START_SERVER = (supportOffline: boolean, defaultRoom: string, done: jest.DoneCallback) =>
    NODE_APP.listen(3000, () => {
        console.log('Node Room Server is running on port 3000');
        // init the node room client
        NodeJsConfig.instance.setConfig({
            nodeFetch: fetch,
            nodeEventSource: eventSource,
        });

        nodeRoomBootstrap({
            canCache: true,
            defaultRoom: defaultRoom,
            host: 'http://localhost:3000',
            supportOffline: supportOffline,
        })
            .then(() => {
                console.log('client registered');
                done();
            })
            .catch((error) => done(error));
    });

export const CLOSE_SERVER = (server: Server<typeof IncomingMessage, typeof ServerResponse>, done: jest.DoneCallback) => {
    // stop server
    closeNodeRoom();
    server.close((err) => {
        server.unref();
        console.log('test server stopped');
        done(err);
    });
};

export const callMutationNode = (nodeName: string, paramObject: any, cb: (result: any) => void): Subscription => {
    const timerRef = failErrorAfterTimeout(MUTATION_TIMEOUT);
    return fetchNode(nodeName, paramObject).subscribe((result) => {
        if (isPureNetworkLoaded(result)) {
            clearTimeout(timerRef);
            setTimeout(() => {
                cb(result.data);
            }, QUERY_TIMEOUT);
        }
    });
};

// APPLICATION TODO TESTER
export class TodoListener {
    private result!: NodeResult;
    private createdTodos: any[] = [];

    constructor(private done: jest.DoneCallback) {}

    // new todo result
    public onNewTodoResult(result: NodeResult) {
        this.result = result;
    }

    // test for created todos
    public testCreatedTodos(createdTodo: any[]) {
        // if we are testing for creation then result should have required data
        // there is no need to wait for the result here
        if (isPureNetworkLoaded(this.result)) {
            // createdTodo should be equal to the result.data as array
            try {
                expect(this.result.data.length).toBe(createdTodo.length);
                expect(this.result.data).toEqual(createdTodo);
            } catch (error) {
                this.done(error);
            }

            this.createdTodos = createdTodo;
        } else {
            this.done(new Error('query result not loaded yet'));
        }
    }
}
