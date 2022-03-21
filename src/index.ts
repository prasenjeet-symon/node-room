import axios from 'axios';
import cors from 'cors';
import express from 'express';
import { BootstrapNode } from './bootstrap';
import { Query } from './decorators/dao';
import { Dao } from './decorators/daoBase';
import { Database } from './decorators/database';

function throttle(Msec: number, pageNum: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            axios.get(`https://rickandmortyapi.com/api/character/?page=${pageNum}`).then((data) => {
                resolve(data.data.results);
            });
        }, Msec);
    });
}

// rick marty api
@Dao({ id: 'id', mode: 'R', paramLabels: '', strictLabels: [], universalLabels: ['rick'] })
class GetCharacters {
    @Query()
    async fetch(pageNum: number) {
        try {
            const result = await throttle(5000, pageNum);
            return result;
        } catch (error) {
            console.error(error);
        }
    }
}

@Database()
class AppDatabase {
    public GetCharacters = GetCharacters;
}

const APP = express();
APP.use(cors());
APP.use(express.json());

const NODE_APP = BootstrapNode.init(APP, { databases: [AppDatabase] }).APP();

NODE_APP.listen('4000', () => {
    console.log('Server is running on port 4000');
});
