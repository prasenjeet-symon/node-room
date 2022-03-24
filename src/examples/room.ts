import { Database } from "../decorators/database";
import { AddTodo, DeleteTodo, GetAllTodo, UpdateTodo } from "./nodes";

@Database()
export class TodoRoom {
  public GetAllTodo = GetAllTodo;
  public UpdateTodo = UpdateTodo;
  public DeleteTodo = DeleteTodo;
  public AddTodo = AddTodo;
}
