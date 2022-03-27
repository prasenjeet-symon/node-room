import { Room } from '../decorators/room';
import { AddTodo, DeleteTodo, GetAllTodo, UpdateTodo } from './nodes';

@Room()
export class TodoRoom {
    public GetAllTodo = GetAllTodo;
    public UpdateTodo = UpdateTodo;
    public DeleteTodo = DeleteTodo;
    public AddTodo = AddTodo;
}
