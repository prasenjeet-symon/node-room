import { Node, nTrue, Query } from '@noderoom/server';
import { Database } from '../../../database/database';

@Node({ mode: 'U', labels: [{ label: 'todo', when: nTrue() }] })
export class MarkCompleteTodoItem {
    @Query()
    async fetch(id: string) {
        return Database.Instance.markComplete(id);
    }
}
