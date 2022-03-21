import axios from 'axios';
import cors from 'cors';
import express from 'express';
import { BootstrapNode } from './bootstrap';
import { Query } from './decorators/dao';
import { Dao } from './decorators/daoBase';
import { Database } from './decorators/database';

function throttle(Msec: number, pageNum: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            axios.get(`https://rickandmortyapi.com/api/character/?page=${pageNum}`).then((data) => {
                resolve(data.data.results);
            });
        }, Msec);
    });
}

// add new todo dao
let allTodo = [
    { id: 1, title: 'todo1', completed: false },
    { id: 2, title: 'todo2', completed: false },
];

// get all todos
@Dao({ id: 'id', mode: 'R', labels: [{ label: 'todo', when: (selfParamObject, mNodeParamObject) => true }] })
export class GetTodo {
    @Query()
    fetch() {
        return allTodo;
    }
}

// update todo
@Dao({ id: 'id', mode: 'U', labels: [{ label: 'todo', when: (selfParamObject, mNodeParamObject) => true }] })
export class UpdateTodo {
    @Query()
    fetch(id: number, completed: boolean) {
        allTodo = allTodo.map((p) => {
            if (p.id === id) {
                return { ...p, completed };
            } else {
                return p;
            }
        });
    }
}

// delete todo
@Dao({ id: 'id', mode: 'D', labels: [{ label: 'todo', when: (selfParamObject, mNodeParamObject) => true }] })
export class DeleteTodo {
    @Query()
    fetch(id: number) {
        allTodo = allTodo.filter((p) => p.id !== id);
    }
}

// add new todo
@Dao({ id: 'id', mode: 'C', labels: [{ label: 'todo', when: (selfParamObject, mNodeParamObject) => true }] })
export class CreateTodo {
    @Query()
    fetch(title: string) {
        allTodo = [...allTodo, { id: allTodo.length + 1, title, completed: false }];
    }
}

@Database()
class AppDatabase {
    public GetTodo = GetTodo;
    public UpdateTodo = UpdateTodo;
    public DeleteTodo = DeleteTodo;
    public CreateTodo = CreateTodo;
}

const APP = express();
APP.use(cors());
APP.use(express.json());

const NODE_APP = BootstrapNode.init(APP, { databases: [AppDatabase] }).APP();

NODE_APP.listen('4000', () => {
    console.log('Server is running on port 4000');
});
