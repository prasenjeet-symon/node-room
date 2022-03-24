import { Dao, nTrue } from "..";
import { Query } from "../decorators/dao";
import { TodoDatabase } from "./model";

// get all todo
@Dao({ id: "id", mode: "R", labels: [{ label: "TODO", when: nTrue() }] })
export class GetAllTodo {
  // Please note that this function name should be exactly the same as the fetch (maybe async )
  @Query()
  fetch() {
    const database = new TodoDatabase();
    return database.getTodos();
  }
}

// update todo
@Dao({ id: "id", mode: "U", labels: [{ label: "TODO", when: nTrue() }] })
export class UpdateTodo {
  // Please note that this function name should be exactly the same as the fetch (maybe async )
  @Query()
  fetch(id: number, title: string, completed: boolean) {
    const database = new TodoDatabase();
    database.updateTodo(id, title, completed);
  }
}

// delete todo
@Dao({ id: "id", mode: "D", labels: [{ label: "TODO", when: nTrue() }] })
export class DeleteTodo {
  // Please note that this function name should be exactly the same as the fetch (maybe async )
  @Query()
  fetch(id: number) {
    const database = new TodoDatabase();
    database.deleteTodo(id);
  }
}

// add todo
@Dao({ id: "id", mode: "C", labels: [{ label: "TODO", when: nTrue() }] })
export class AddTodo {
  // Please note that this function name should be exactly the same as the fetch (maybe async )
  @Query()
  fetch(title: string, completed: boolean) {
    const database = new TodoDatabase();
    database.addTodo(title, completed);
  }
}
