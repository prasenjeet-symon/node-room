import eventSource from 'eventsource';
import { Server } from 'http';
import { fetchNode, NodeJsConfig, NodeResult, nodeRoomBootstrap } from 'node-room-client';
import { closeNodeRoom } from '../src/utils';
import { NODE_APP } from './test-applications/todo-application';
const fetch = require('node-fetch');

// some helper functions
const isPureNetworkLoaded = (result: NodeResult) => {
    return !result.isLocal && result.status === 'loaded';
};
const delayExecution = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const failErrorAfterTimeout = (ms: number) => {
    return setTimeout(() => {
        throw new Error('Timeout');
    }, ms);
};
const MUTATION_TIMEOUT = 10000;
const QUERY_TIMEOUT = 2000;

describe('as-todo-test', () => {
    let nodeRoomServer: Server;
    // increase timeout
    jest.setTimeout(50000);

    // before all jest
    beforeAll((done) => {
        // start server
        nodeRoomServer = NODE_APP.listen(3000, () => {
            console.log('Node Room Server is running on port 3000');
            // init the node room client
            NodeJsConfig.instance.setConfig({
                nodeFetch: fetch,
                nodeEventSource: eventSource,
            });

            nodeRoomBootstrap({
                canCache: true,
                defaultRoom: 'TodoRoom',
                host: 'http://localhost:3000',
                supportOffline: false,
            })
                .then(() => {
                    console.log('client registered');
                    done();
                })
                .catch((error) => done(error));
        });
    });

    test('test as todo', (done) => {
        const subs: any[] = [];
        // create a new todo
        // helper function to create a new todo
        const createTodo = (title: string, completed: boolean, cb: (result: any) => void) => {
            const timerRef = failErrorAfterTimeout(MUTATION_TIMEOUT);
            return fetchNode('AddTodo', { title, completed }).subscribe((result) => {
                if (isPureNetworkLoaded(result)) {
                    clearTimeout(timerRef);
                    setTimeout(() => {
                        cb(result.data);
                    }, QUERY_TIMEOUT);
                }
            });
        };

        class TodoListener {
            private static instance: TodoListener;
            private result!: NodeResult;
            private createdTodos: any[] = [];

            private constructor() {}

            public static getInstance() {
                if (!TodoListener.instance) {
                    TodoListener.instance = new TodoListener();
                }
                return TodoListener.instance;
            }

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
                        console.log(this.result.data, 'DATA' , createdTodo)
                        expect(this.result.data).toEqual(createdTodo);
                    } catch (error) {
                        done(error);
                    }
                    this.createdTodos = createdTodo;
                } else {
                    // fail
                    throw new Error('Result is not loaded');
                }
            }
        }

        const subs1 = fetchNode('GetAllTodo', {}).subscribe((result) => {
            if (isPureNetworkLoaded(result)) {
                TodoListener.getInstance().onNewTodoResult(result);
            }
        });

        subs.push(subs1);

        // add 3 todos
        // mutation node run first then query node
        // if we get the result then after query node will push the result
        const subs2 = createTodo('test', false, (result1) => {
            TodoListener.getInstance().testCreatedTodos([result1]);
            const subs3 = createTodo('test2', false, (result2) => {
                TodoListener.getInstance().testCreatedTodos([result1, result2]);
                const subs4 = createTodo('test3', false, (result3) => {
                    TodoListener.getInstance().testCreatedTodos([result1, result2, result3]);
                    // completed
                    subs.forEach((p) => p.unsubscribe());
                    done();
                });

                subs.push(subs4);
            });

            subs.push(subs3);
        });

        subs.push(subs2);
    });

    // after all jest
    afterAll((done) => {
        // stop server
        closeNodeRoom();
        console.log('test server stopped');
        nodeRoomServer.close((err) => {
            nodeRoomServer.unref();
            done(err);
        });
    });
});
