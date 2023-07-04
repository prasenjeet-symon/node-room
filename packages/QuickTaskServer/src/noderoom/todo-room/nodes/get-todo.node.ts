import { Node, nrParam, nrReturn, nrString, nTrue, Query } from '@noderoom/server';
import { Database } from '../../../database/database';

@Node({ id: 'id', mode: 'R', labels: [{ label: 'todo', when: nTrue() }] })
export class getTodos {
    @Query()
    @nrReturn(nrString())
    @nrParam(nrString(), nrString())
    async fetch(start: number, limit: number) {
        return Database.Instance.getTodos(start, limit);
    }
}
