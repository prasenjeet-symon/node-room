import { Server } from 'http';
import { fetchNode } from 'node-room-client';
import { callMutationNode, CLOSE_SERVER, START_SERVER, TodoListener } from './utils';

describe('as-todo-test', () => {
    let nodeRoomServer: Server;
    jest.setTimeout(50000);

    beforeAll((done) => {
        nodeRoomServer = START_SERVER(false, 'TodoRoom', done);
    });

    afterAll((done) => {
        CLOSE_SERVER(nodeRoomServer, done);
    });

    test('test as todo application', (done) => {
        const todoListener = new TodoListener(done);
        const subs: any[] = [];

        const subs1 = fetchNode('GetAllTodo', {}).subscribe((result) => {
            todoListener.onNewTodoResult(result);
        });

        subs.push(subs1);

        // add 3 todos
        // mutation node run first then query node
        // if we get the result then after query node will push the result
        const subs2 = callMutationNode('AddTodo', { title: 'test', completed: false }, (result) => {
            todoListener.testCreatedTodos([result]);
            const subs3 = callMutationNode('AddTodo', { title: 'test1', completed: false }, (result1) => {
                todoListener.testCreatedTodos([result, result1]);
                const subs4 = callMutationNode('AddTodo', { title: 'test2', completed: false }, (result2) => {
                    todoListener.testCreatedTodos([result, result1, result2]);
                    subs.forEach((p) => p.unsubscribe());
                    done();
                });

                subs.push(subs4);
            });
            subs.push(subs3);
        });

        subs.push(subs2);
    });
});
