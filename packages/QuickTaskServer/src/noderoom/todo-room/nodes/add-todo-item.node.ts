import { Node, nTrue, Query } from '@noderoom/server';
import { Database } from '../../../database/database';

@Node({ mode: 'C', labels: [{ label: 'todo', when: nTrue() }] })
export class AddNewTodo {
    @Query()
    async fetch(item: string, description: string) {
        return Database.Instance.addNewItem(item, description);
    }
}
