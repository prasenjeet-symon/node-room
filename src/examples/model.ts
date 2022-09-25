// this is in memory database

// holds all the todo
const TODOS: any[] = [
    { id: 1, title: 'todo 1', completed: false, date: new Date() },
    { id: 2, title: 'todo 2', completed: false , date: new Date()},
    { id: 3, title: 'todo 3', completed: false , date: new Date()},
    { id: 4, title: 'todo 4', completed: false , date: new Date()},
];

export class TodoDatabase {
    constructor() {}

    // generate new id
    public generateId(): number {
        // generate random number between 1 and 100
        // then add that to the current timestamp
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        return randomNumber + +new Date();
    }

    // add new todo
    public addTodo(title: string, completed: boolean): void {
        TODOS.push({
            id: this.generateId(),
            title: title,
            completed: completed,
            date: new Date(),
        });
    }

    // delete todo
    public deleteTodo(id: number): void {
        const index = TODOS.findIndex((todo) => todo.id === id);
        if (index !== -1) {
            TODOS.splice(index, 1);
        }
    }

    // update tod
    public updateTodo(id: number, completed: boolean): void {
        const index = TODOS.findIndex((todo) => todo.id === id);
        if (index !== -1) {
            TODOS[index].completed = completed;
        }
    }

    // get all todos
    public getTodos() {
        return TODOS;
    }

    // get limited todo
    public getLimitedTodos(offset: number, limit: number) {
        
        // sort by date and then get the limited todo
        const jk =  TODOS.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(offset, offset + limit);
        
        return jk;
    }
}
