import { mutateNode } from '@noderoom/react-client';
import './todo-item.css';

function markComplete(id: string) {
    mutateNode('markComplete', { id });
}

function TodoItem(props: any) {
    const todoItem: any = props.todo;
    return (
        <div className="todoItem">
            <div>
                <img src="https://louisvillegeek.com/wp-content/uploads/2020/01/planner-logo.png" alt="" />
            </div>
            <div>
                <div>{todoItem.item}</div>
                <div>{todoItem.description}</div>
            </div>
            <div>
                {todoItem.isCompleted ? (
                    <button  className="completedButton" type="button">
                        Completed 😇
                    </button>
                ) : (
                    <button onClick={()=> markComplete(todoItem.id)} className="completeButton" type="button">
                        Complete
                    </button>
                )}
            </div>
        </div>
    );
}

export default TodoItem;
