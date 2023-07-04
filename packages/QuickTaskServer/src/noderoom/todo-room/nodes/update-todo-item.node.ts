import { Node, nrParam, nrReturn, nrString, nTrue, Query } from '@noderoom/server';
import { Database } from '../../../database/database';

@Node({ mode: 'U', labels: [{ label: 'todo', when: nTrue() }] })
export class MarkCompleteTodoItem {
    @Query()
    @nrReturn(nrString())
    @nrParam(nrString())
    async fetch(id: string) {
        return Database.Instance.markComplete(id);
    }
}
