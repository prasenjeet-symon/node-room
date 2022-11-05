export interface ITodo {
    id: number;
    title: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class TodoDatabase {
    private static instance: TodoDatabase;
    private TODOS: ITodo[] = [];

    private constructor() {}

    public static getInstance(): TodoDatabase {
        if (!TodoDatabase.instance) {
            TodoDatabase.instance = new TodoDatabase();
        }
        return TodoDatabase.instance;
    }

    // generate new id
    private generateId(): number {
        // generate random number between 1 and 100
        // then add that to the current timestamp
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        return randomNumber + +new Date();
    }

    // add a new todo
    public addTodo(title: string, completed: boolean) {
        const newTodo: ITodo = {
            id: this.generateId(),
            title,
            completed,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.TODOS.push(newTodo);
        return newTodo;
    }

    // update a todo
    public updateTodoTitle(id: number, title: string) {
        const index = this.TODOS.findIndex((todo) => todo.id === id);
        if (index !== -1) {
            const targetObject = this.TODOS[index];
            if (targetObject) {
                targetObject.title = title;
                targetObject.updatedAt = new Date();
            }
        }
    }

    // mark given todo as completed
    public markTodoAsCompleted(id: number) {
        const index = this.TODOS.findIndex((todo) => todo.id === id);
        if (index !== -1) {
            const targetObject = this.TODOS[index];
            if (targetObject) {
                targetObject.completed = true;
                targetObject.updatedAt = new Date();
            }
        }
    }

    // delete a todo
    public deleteTodoById(id: number) {
        const index = this.TODOS.findIndex((todo) => todo.id === id);
        if (index !== -1) {
            this.TODOS.splice(index, 1);
        }
    }

    // get a todo
    public getTodoById(id: number) {
        return this.TODOS.find((todo) => todo.id === id);
    }

    // get all completed todos
    public getCompletedTodos() {
        return this.TODOS.filter((todo) => todo.completed);
    }

    // get all uncompleted todos
    public getUncompletedTodos() {
        return this.TODOS.filter((todo) => !todo.completed);
    }

    // get all todos
    public getAllTodos() {
        return this.TODOS;
    }

    // get limited all todos
    public getLimitedAllTodos(offset: number, limit: number) {
        // sort by date and then get the limited todo
        return this.TODOS.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(offset, offset + limit);
    }

    // get limited completed todos
    public getLimitedCompletedTodos(offset: number, limit: number) {
        // sort by createdAt and then get the limited todo
        return this.TODOS.filter((todo) => todo.completed)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(offset, offset + limit);
    }

    // get limited uncompleted todos
    public getLimitedUncompletedTodos(offset: number, limit: number) {
        // sort by createdAt and then get the limited todo
        return this.TODOS.filter((todo) => !todo.completed)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(offset, offset + limit);
    }

    // clear all todos
    public clearAllTodos() {
        this.TODOS.splice(0, this.TODOS.length);
    }
}
