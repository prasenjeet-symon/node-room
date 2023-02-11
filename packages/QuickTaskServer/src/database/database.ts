import { v4 } from 'uuid';

interface ITodo {
    id: string;
    item: string;
    description: string;
    dateCreated: Date;
    dateUpdated: Date;
    isCompleted: boolean;
}

export class Database {
    private static _instance: Database;
    private todos: ITodo[] = [];

    private constructor() {}

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    // add new item
    public addNewItem(item: string, description: string): Promise<ITodo> {
        return new Promise((resolve, reject) => {
            const todo: ITodo = {
                id: v4(),
                dateCreated: new Date(),
                dateUpdated: new Date(),
                description: description,
                item: item,
                isCompleted: false,
            };

            this.todos.push(todo);

            resolve(todo);
        });
    }

    // mark todo complete
    public markComplete(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.todos = this.todos.map((p) => {
                if (p.id === id) {
                    return { ...p, isCompleted: true };
                } else {
                    return { ...p };
                }
            });

            resolve();
        });
    }

    // get todos
    public getTodos(start: number, limit: number): Promise<ITodo[]> {
        return new Promise((resolve, reject) => {
            // Dummy data for to-do items
            resolve([...this.todos].sort((a, b) => +b.dateCreated - +a.dateCreated).slice(start, start + limit));
        });
    }
}
