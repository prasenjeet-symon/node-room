// we need to create a new file called index.js inside folder node_modules/@noderoom/react-client/build/esm/room from the file located in the node_modules/@noderoom/nodezen/build/index.js
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';

(() => {
    const content = `exports.sayHello = (name) => {
        console.log(name);
    }`;

    const pathToBuild = 'node_modules/@noderoom/react-client/build/esm';
    // delete the dir room if it exists
    if (existsSync(pathToBuild + '/rooms')) {
        rmSync(pathToBuild + '/rooms', { recursive: true, force: true });
    }

    // create the dir room
    mkdirSync(pathToBuild + '/rooms');
    // create the file
    writeFileSync(pathToBuild + '/rooms/index.js', content);

    // also add new file to same dir "index.d.ts"
    const indexDTS = `export function sayHello(name: string): void;`
    writeFileSync(pathToBuild + '/rooms/index.d.ts', indexDTS);
})();
