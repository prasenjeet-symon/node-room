import { Room } from '../decorators/room';
import { AddTodo, DeleteTodo, GetAllTodo, GetLimitedTodos, UpdateTodo } from './nodes';

@Room('TodoRoom')
export class TodoRoom {
    public GetAllTodo = GetAllTodo;
    public UpdateTodo = UpdateTodo;
    public DeleteTodo = DeleteTodo;
    public AddTodo = AddTodo;
    public GetLimitedTodos = GetLimitedTodos;
}
