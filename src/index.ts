import { Dao } from './base-class/dao-base';
import { BootstrapNode } from './bootstrap';
import { Query } from './decorators/dao';
import { Database } from './decorators/database';
import { Column, Table } from './decorators/table';
import { MYSQL_DATATYPE } from './utils';

@Table({ primaryKey: 'id', tableCode: 't1' })
export class Todo {
    @Column({ columnID: 'c1', dataType: MYSQL_DATATYPE.BIGINT(false) })
    public id!: number;

    @Column({ columnID: 'c2', isNotNull: true, dataType: MYSQL_DATATYPE.VARCHAR(5000) })
    public title!: string;

    @Column({ columnID: 'c3', dataType: MYSQL_DATATYPE.TINYTEXT })
    public description!: string;

    @Column({ columnID: 'c4', dataType: MYSQL_DATATYPE.BOOLEAN })
    public done!: boolean;
}

// create new dao to update the todo
export class UpdateTodo extends Dao<any> {
    constructor(env?: any) {
        super(env);
    }

    @Query(' UPDATE Todo SET done = :done: WHERE id IN ( :id: ) ;')
    async fetch(done: boolean, id: number[]): Promise<any> {
        return this.DBData;
    }
}

export class AddTodo extends Dao<any> {
    constructor(env?: any) {
        super(env);
    }

    @Query(' INSERT INTO Todo (title, description, done) VALUES (:title:, :description:, :done:); ')
    async fetch(title: string, description: string, done: boolean): Promise<any> {
        return this.DBData;
    }
}

export class getTodo extends Dao<any> { 
    constructor(env?: any) {
        super(env);
    }

    @Query(' SELECT * FROM Todo WHERE id IN ( :id: ) ;')
    async fetch(id: number[]): Promise<any> {
        return this.DBData;
    }
}

@Database({ Tables: [Todo] })
export class TodoDatabase {
    public AddTodo = AddTodo;
    public UpdateTodo = UpdateTodo;
    public getTodo = getTodo;
}

// init the app
const app = BootstrapNode.init({ databases: [TodoDatabase], migrate: false });
app.express.listen(3000, () => {
    console.log('listening on port 3000');
});
