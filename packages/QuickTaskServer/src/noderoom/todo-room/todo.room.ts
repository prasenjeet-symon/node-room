import { Room } from '@noderoom/server';
import { AddNewTodo } from './nodes/add-todo-item.node';
import { getTodos } from './nodes/get-todo.node';
import { MarkCompleteTodoItem } from './nodes/update-todo-item.node';

export const NODE_LABEL = {
    todo: 'TODO_LABEL',
};

@Room('todoRoom')
export class TodoRoom {
    public addNewTodo = AddNewTodo;
    public markComplete = MarkCompleteTodoItem;
    public getTodos = getTodos;
}
