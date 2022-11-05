// create the query node to get the all todos

import { Node, nTrue, Query } from '../../../src';
import { TodoDatabase } from './database';

// get all todos
@Node({ id: 'id', mode: 'R', labels: [{ label: 'TODO', when: nTrue() }] })
export class GetAllTodo {
    @Query()
    async fetch() {
        return TodoDatabase.getInstance().getAllTodos();
    }
}

// add mutation node to add a todo
@Node({ mode: 'C', labels: [{ label: 'TODO', when: nTrue() }] })
export class AddTodo {
    @Query()
    async fetch(title: string, completed: boolean) {
        return TodoDatabase.getInstance().addTodo(title, completed);
    }
}

// add mutation node to update a todo
@Node({ mode: 'U', labels: [{ label: 'TODO', when: nTrue() }] })
export class UpdateTodoTitle {
    @Query()
    async fetch(id: number, title: string) {
        return TodoDatabase.getInstance().updateTodoTitle(id, title);
    }
}

// add mutation node to mark a todo as completed
@Node({ mode: 'U', labels: [{ label: 'TODO', when: nTrue() }] })
export class MarkTodoAsCompleted {
    @Query()
    async fetch(id: number) {
        return TodoDatabase.getInstance().markTodoAsCompleted(id);
    }
}

// add mutation node to delete a todo
@Node({ mode: 'D', labels: [{ label: 'TODO', when: nTrue() }] })
export class DeleteTodo {
    @Query()
    async fetch(id: number) {
        return TodoDatabase.getInstance().deleteTodoById(id);
    }
}

// get limit todos by offset and limit
@Node({ id: 'id', mode: 'R', labels: [{ label: 'TODO', when: nTrue() }] })
export class GetLimitTodo {
    @Query()
    async fetch(offset: number, limit: number) {
        return TodoDatabase.getInstance().getLimitedAllTodos(offset, limit);
    }
}

// get completed limit todos by offset and limit
@Node({ id: 'id', mode: 'R', labels: [{ label: 'TODO', when: nTrue() }] })
export class GetCompletedLimitTodo {
    @Query()
    async fetch(offset: number, limit: number) {
        return TodoDatabase.getInstance().getLimitedCompletedTodos(offset, limit);
    }
}

// get uncompleted limit todos by offset and limit
@Node({ id: 'id', mode: 'R', labels: [{ label: 'TODO', when: nTrue() }] })
export class GetUncompletedLimitTodo {
    @Query()
    async fetch(offset: number, limit: number) {
        return TodoDatabase.getInstance().getLimitedUncompletedTodos(offset, limit);
    }
}

// clear all todos
@Node({ mode: 'D', labels: [{ label: 'TODO', when: nTrue() }] })
export class ClearAllTodo {
    @Query()
    async fetch() {
        return TodoDatabase.getInstance().clearAllTodos();
    }
}
