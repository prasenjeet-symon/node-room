import { Room } from '../../../src';
import { AddTodo, ClearAllTodo, DeleteTodo, GetAllTodo, GetCompletedLimitTodo, GetLimitTodo, GetUncompletedLimitTodo, MarkTodoAsCompleted, UpdateTodoTitle } from './nodes';

@Room('TodoRoom')
export class TodoRoom {
    constructor() {}

    public GetAllTodo = GetAllTodo;
    public AddTodo = AddTodo;
    public UpdateTodoTitle = UpdateTodoTitle;
    public MarkTodoAsCompleted = MarkTodoAsCompleted;
    public DeleteTodo = DeleteTodo;
    public GetLimitTodo = GetLimitTodo;
    public GetCompletedLimitTodo = GetCompletedLimitTodo;
    public GetUncompletedLimitTodo = GetUncompletedLimitTodo;
    public ClearAllTodo = ClearAllTodo;
}
