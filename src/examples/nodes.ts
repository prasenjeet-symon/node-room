import { Node, nTrue } from '..';
import { Query } from '../decorators/node';
import { TodoDatabase } from './model';

// get all todo
@Node({ id: 'id', mode: 'R', labels: [{ label: 'TODO', when: nTrue() }] })
export class GetAllTodo {
    // Please note that this function name should be exactly the same as the fetch (maybe async )
    @Query()
    fetch() {
        const database = new TodoDatabase();
        return database.getTodos();
    }
}

// update todo
@Node({ id: 'id', mode: 'U', labels: [{ label: 'TODO', when: nTrue() }] })
export class UpdateTodo {
    // Please note that this function name should be exactly the same as the fetch (maybe async )
    @Query()
    fetch(id: number, completed: boolean) {
        const database = new TodoDatabase();
        database.updateTodo(id, completed);
    }
}

// delete todo
@Node({ id: 'id', mode: 'D', labels: [{ label: 'TODO', when: nTrue() }] })
export class DeleteTodo {
    // Please note that this function name should be exactly the same as the fetch (maybe async )
    @Query()
    fetch(id: number) {
        const database = new TodoDatabase();
        database.deleteTodo(id);
    }
}

// add todo
@Node({ id: 'id', mode: 'C', labels: [{ label: 'TODO', when: nTrue() }] })
export class AddTodo {
    // Please note that this function name should be exactly the same as the fetch (maybe async )
    @Query()
    fetch(title: string) {
        const database = new TodoDatabase();
        database.addTodo(title, true);
    }
}

// get limited todo
@Node({ id: 'id', mode: 'R', labels: [{ label: 'TODO', when: nTrue() }] })
export class GetLimitedTodos {
    // Please note that this function name should be exactly the same as the fetch (maybe async )
    @Query()
    async fetch(offset: number, limit: number) {
        const database = new TodoDatabase();
        return database.getLimitedTodos(offset, limit);
    }
}
