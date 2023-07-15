import { faker } from '@faker-js/faker';
import { useState } from 'react';
import { mutateNode } from '@noderoom/react-client';
import { sayHello } from '@noderoom/react-client/build/esm/rooms';
import './addTodoItem.css';


const createTodo = (item: string, setTask: React.Dispatch<React.SetStateAction<string>>) => {
    sayHello('Hello Merry');
    if (!item) return;
    mutateNode('addNewTodo', { item: item, description: faker.lorem.sentences(2) }).then(() => setTask(''));
};

function AddTodoItem() {
    const [task, setTask] = useState('');


    return (
        <div className="todoInput">
            <input onChange={(ev) => setTask(ev.target.value)} value={task} placeholder="Enter task here..." type="text" />
            <button onClick={() => createTodo(task, setTask)} type="button">
                Add Task
            </button>
        </div>
    );
}

export default AddTodoItem;
