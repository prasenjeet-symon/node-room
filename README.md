# Build Horizontally Scalable Real-Time Applications with NodeRoom

NodeRoom is a Node.js framework for building horizontally scalable real-time applications. It is built on top of [Express](http://expressjs.com/). It does not use WebSockets, but instead uses SSE (Server Sent Events) to achieve real-time communication.

>NodeRoom is a work in progress. It is not ready for production use.

---

## Core Concept
Building block of NodeRoom is `node` which consist of two major parts:

1. `Controller` - A function that handles the database operations and returns the data to the node.

2. `Invalidator` - A set of conditions that determines when the data returned by the controller is outdated and needs to be refreshed.

### Node Types
NodeRoom supports two types of nodes:

1. `Query` - A node that is responsible for fetching data from the database.

2. `Mutation` - A node that is responsible for updating the database.

### Node Room
NodeRoom groups the similar nodes into `room`. A room is a collection of nodes that share the same task. Any of the query nodes in a room can be subscribed to by the client. When a query node is subscribed to, the client will receive the data returned by the controller of the node. The client will also receive the updates to the data as and when the data is invalidated and the controller is called again.

When a mutation node in the room invalidates any of the query nodes, the client is notified with the updated data. Client can only subscribe to the query nodes in a room. It cannot subscribe to the mutation nodes but it can call the mutation nodes of the room.

> You can have multiple rooms in a single application. Each room can have multiple nodes. 😇

## Enough Theory, Show Me Some Code

### Requirements
1. Node.js >= 6.0.0

### Installation
```bash
npm install node-room
```
### How to create a `Node`?
```js
import { Node , nTrue, Query} from 'node-room';

@Node({ id: 'id', mode: 'R', labels: [{ label: 'MY_LABEL', when: nTrue() }] })
export class MyFirstNode {
    
    @Query()
    async fetch(param1, param2) {
        // Do some database operations and return the data
        // Below is just a dummy code

        // Start of dummy code
        const database = new MyDatabase();
        const result = await database.giveMeSomeResult(param1, param2);
        return result;
        // End of dummy code
    }

}
```

Practically node is nothing but a class with a `fetch` method. The `fetch` method is responsible for fetching the data from the database. The `fetch` method can take any number of parameters. The parameters are passed to the `fetch` method by the client when it subscribes to the node.

The `@Node` decorator is used to decorate the class. It takes an object as an argument. The object has the following properties:

1. `id` - If your query node is returning the array of rows from the database, then you can specify the `id` property. The `id` property is used to uniquely identify the rows in the array. The `id` property is used to determine which rows are added, removed or updated in the array. If the `id` property is not specified, then the whole array is sent to the client whenever the data is invalidated which is not very efficient. We only send the `delta` to the client but in case of array without `id` property, we have to send the whole array.

2. `mode` - The mode of the node. It can be either `R`, `D`, `U` or `C`. `R` stands for `Read`, `D` stands for `Delete`, `U` stands for `Update` and `C` stands for `Create`. The mode is used to determine the type of the node. If the mode is `R`, then the node is a `Query` node. If the mode is `D`, `U` or `C`, then the node is a `Mutation` node.

3. `labels` - An array of labels. Each label has a `label` property and a `when` property. The `label` property is the name of the label. The `when` property is a function that returns a boolean value. The `when` function is used to determine whether the node should be labeled with the given label or not. The `when` function takes three arguments: 

    1. `selfParamObject` - An object containing the parameters passed to the `fetch` method of the node. It is the same object that is passed to the `fetch` method by the client when it subscribes or calls the node.

    2. `mutationNodeParamObject` - An object containing the parameters passed to the `fetch` method of the mutation node that invalidated the node. It is the same object that is passed to the `fetch` method by the client when it calls the mutation node.

    3. `mutationNodeType` - The type of the mutation node that invalidated the node. It can be either `D`, `U` or `C`. `D` stands for `Delete`, `U` stands for `Update` and `C` stands for `Create`.

    The `when` function should return `true` if the node should be labeled with the given label and `false` otherwise. Use those three arguments to determine whether the node should be labeled with the given label or not.

    When the mutation node invalidates the node, we check the labels of the node. If the node has any label that matches the label of the mutation node, then the node is invalidated. If the node does not have any label that matches the label of the mutation node, then the node is not invalidated.

    > You can reuse your whenFunction in multiple labels. You can also use the same label in multiple nodes. So try to store labels in a separate file and reuse them.

    **Modification node** is always labeled with the given labels irrespective of the `whenFunction`. So you can use the built in whenFunction called as `nTrue` that always return true.


### How to create `room` and add `node` to it ?

```js
import { Room } from 'node-room';
import { MyFirstNode } from './my-first-node';
 
 @Room('MyUniqueRoomName')
 export class MyFirstNodeRoom {
    public myFirstNode = MyFirstNode
    // add all your node here as public property
}
```

Practically room is nothing but a class with node as public property. The `@Room` decorator is used to decorate the class. It takes the name of the room as an argument. The name of the room should be unique. You can have multiple rooms in a single application. Each room can have multiple nodes.

### Let's add the room to the application and start the server

```js
    import express from 'express';
    import { NodeRoom } from 'node-room';
    import { MyFirstNodeRoom } from './my-first-node-room';

    const APP = express();
    APP.use(express.json());

    // add node room the application
    const NODE_ROOM_APP = NodeRoom.init(APP,{ clientKillTimeout: 100000, rooms: [TodoRoom], storage: DFStore, broker: NodeBroker }).app();

    // start the server
    NODE_APP.listen(3000, () => {
        console.log('Server started at port 3000');
    });
```

The `NodeRoom.init` method takes three arguments:

1. `app` - The express application.

2. `options` - An object containing the following properties:

    1. `clientKillTimeout` - The time in `milliseconds` after which the client is disconnected if it does not send any message to the server. After the client is disconnected it cannot receive any changes from the server.

    2. `rooms` - An array of rooms. The rooms that you want to add to the application.

    3. `storage` - The storage that you want to use. You can also create your own storage. The storage should implement the `INodeStorage` interface. This is key value storage. You can use any famous key value storage like `Redis`, `MongoDB`, `LevelDB`, `Memcached` etc. If you are planning to use single server, then just use Map as storage.

    4. `broker` - The broker that you want to use. You can also create your own broker. The broker should implement the `INodeBroker` interface. You can use any famous message broker like `RabbitMQ`, `Kafka`, `Redis` etc. If you are planning to use single server, then just use `EventEmitterManager` from node-room as broker.


*** ***

### How to make custom storage for single server instance ?

```js
import { INodeStorage } from 'node-room';

export class DFStore implements INodeStorage {
    private store = new Map();

    constructor() {}

    async add(key: string, value: string) {
        this.store.set(key, value);
    }

    async get(key: string) {
        return this.store.get(key);
    }

    async remove(key: string) {
        this.store.delete(key);
    }
}
```

### How to make custom broker for single server instance ?

```js
import { INodeBroker , EventEmitterManager} from 'node-room';

export class NodeBroker implements INodeBroker {
   constructor() {}

    public async publish(msg: string) {
        EventEmitterManager.getInstance().emit('msg', msg);
    }

    public async subscribe(callback: (msg: string) => void) {
        EventEmitterManager.getInstance().on('msg', callback);
    }
}
```



