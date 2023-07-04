import { Node, nrParam, nrReturn, nrString, nTrue, Query } from '@noderoom/server';
import { Database } from '../../../database/database';

@Node({ mode: 'C', labels: [{ label: 'todo', when: nTrue() }] })
export class AddNewTodo {
    @Query()
    @nrReturn(nrString())
    @nrParam(nrString(), nrString())
    async fetch(item: string, description: string) {
        return Database.Instance.addNewItem(item, description);
    }
}
