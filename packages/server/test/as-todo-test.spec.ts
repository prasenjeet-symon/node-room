import eventSource from 'eventsource';
import { Server } from 'http';
import { fetchNode, NodeJsConfig, nodeRoomBootstrap } from 'node-room-client';
import { closeNodeRoom } from '../src/utils';
import { NODE_APP } from './test-applications/todo-application';
const fetch = require('node-fetch');

// slow down the code
const delayExecution = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('as-todo-test', () => {
    let nodeRoomServer: Server;

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
                supportOffline: true,
            })
                .then(() => {
                    console.log('client registered');
                    done();
                })
                .catch((error) => done(error));
        });
    });

    test('test as todo', (done) => {
        // get all todos
        let counter = 0;
        const subs: any[] = [];
        const createdTodos: any[] = [];

        const subs1 = fetchNode('GetAllTodo', {}).subscribe((result) => {
            if (counter === 0 && !result.isLocal && result.status === 'loaded') {
                // first time we get the data from the server
                expect(result.data.length).toBe(0);
                counter++;
            }

            if (createdTodos.length !== 0 && counter === 1 && !result.isLocal && result.status === 'loaded') {
                // new todo is created
                expect(result.data.length).toBe(1);
                expect(result.data[0].id).toBe(createdTodos[0].id);
                expect(result.data[0]).toEqual(createdTodos[0]);
                counter++;

                subs.forEach((sub) => sub.unsubscribe());
                done();
            }
        });

        subs.push(subs1);

        // add todo
        const subs2 = fetchNode('AddTodo', { title: 'test 1', completed: false }).subscribe((result) => {
            if (result.status === 'loaded') {
                createdTodos.push(result.data);
            }
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
