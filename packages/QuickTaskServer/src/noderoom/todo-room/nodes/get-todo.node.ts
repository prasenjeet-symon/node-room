import { Node, nTrue, Query } from '@noderoom/server';
import { Database } from '../../../database/database';
import { NODE_LABEL } from '../todo.room';

@Node({ id: 'id', mode: 'R', labels: [{ label: 'todo', when: nTrue() }] })
export class getTodos {
    @Query()
    async fetch(start: number, limit: number) {
        return Database.Instance.getTodos(start, limit);
    }
}
