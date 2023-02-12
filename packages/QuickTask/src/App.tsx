import { getNode, paginationNode } from '@noderoom/react-client';
import AddTodoItem from './add-todo/addTodoItem';
import './App.css';
import TodoItem from './todo-item/todo-item';

let offset = 0;
const limit = 3;

// paginate
function loadMore(paginationID: string) {
    offset = offset + limit;
    paginationNode('getTodos', { start: offset, limit: limit }, { paginationID: paginationID });
}

function App() {
    const todos = getNode('getTodos', { start: offset, limit: limit });

    if (todos !== null && todos.status === 'loaded') {
        return (
            <div className="todoWrapper">
                <AddTodoItem />

                {todos.data.map((todo: any) => {
                    return <TodoItem key={todo.id} todo={todo} />;
                })}

                {/* load more button */}
                {!todos.isReachEnd && !todos.isLoadingMore ? (
                    <button type="button" onClick={() => loadMore(todos.paginationID as string)}>
                        Load More
                    </button>
                ) : (
                    ''
                )}
                {todos.isLoadingMore ? <div>Loading more data ...</div> : ''}
            </div>
        );
    } else {
        return <div>Loading Todos</div>;
    }
}

export default App;
